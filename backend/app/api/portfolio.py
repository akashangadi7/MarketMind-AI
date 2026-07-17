from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, PortfolioAsset, Transaction, AuditLog
from app.schemas import PortfolioAssetOut, TransactionCreate, TransactionOut
from app.services.market_service import get_live_price

router = APIRouter()

@router.get("", response_model=List[PortfolioAssetOut])
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assets = db.query(PortfolioAsset).filter(PortfolioAsset.user_id == current_user.id).all()
    
    enriched_assets = []
    for asset in assets:
        # Fetch live price
        live_price = get_live_price(str(asset.symbol), str(asset.asset_type)) or float(asset.average_buy_price)
        
        current_value = float(asset.shares_quantity) * float(live_price)
        cost_basis = float(asset.shares_quantity) * float(asset.average_buy_price)
        p_l = current_value - cost_basis
        p_l_pct = (p_l / cost_basis * 100.0) if cost_basis > 0 else 0.0
        
        enriched_assets.append(
            PortfolioAssetOut(
                id=int(asset.id),
                symbol=str(asset.symbol),
                asset_type=str(asset.asset_type),
                shares_quantity=float(asset.shares_quantity),
                average_buy_price=float(asset.average_buy_price),
                current_price=float(live_price),
                current_value=float(current_value),
                profit_loss=float(p_l),
                profit_loss_pct=float(p_l_pct)
            )
        )
    return enriched_assets

@router.post("/transaction", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def record_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify transaction variables
    if tx_in.quantity <= 0 or tx_in.price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and price must be greater than zero.")
    
    tx_type = tx_in.type.upper()
    if tx_type not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Transaction type must be 'BUY' or 'SELL'.")

    # Clean symbol and detect type
    symbol = tx_in.symbol.strip().upper()
    
    # We simple classify: if symbol is standard known crypto, label crypto. Else stock.
    crypto_symbols = {"BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE"}
    asset_type = "crypto" if symbol in crypto_symbols or symbol.endswith("USDT") else "stock"
    
    # Fetch existing asset
    asset = db.query(PortfolioAsset).filter(
        PortfolioAsset.user_id == current_user.id,
        PortfolioAsset.symbol == symbol
    ).first()
    
    if tx_type == "BUY":
        if not asset:
            asset = PortfolioAsset(
                user_id=int(current_user.id), # type: ignore
                symbol=str(symbol),
                asset_type=str(asset_type),
                shares_quantity=float(tx_in.quantity),
                average_buy_price=float(tx_in.price)
            )
            db.add(asset)
        else:
            # Re-calculate average buy price
            total_shares = float(asset.shares_quantity) + tx_in.quantity
            total_cost = (float(asset.shares_quantity) * float(asset.average_buy_price)) + (tx_in.quantity * tx_in.price)
            asset.average_buy_price = float(total_cost / total_shares if total_shares > 0 else 0.0)
            asset.shares_quantity = float(total_shares)
    else:  # SELL
        if not asset or float(asset.shares_quantity) < tx_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient holdings to sell {tx_in.quantity} of {symbol}. Current holdings: {float(asset.shares_quantity) if asset else 0}"
            )
        
        asset.shares_quantity = float(float(asset.shares_quantity) - tx_in.quantity)
        if float(asset.shares_quantity) <= 0:
            db.delete(asset)

    # Save transaction
    db_tx = Transaction(
        user_id=int(current_user.id), # type: ignore
        symbol=str(symbol),
        type=str(tx_type),
        quantity=float(tx_in.quantity),
        price=float(tx_in.price)
    )
    db.add(db_tx)
    
    # Audit log
    audit = AuditLog(
        user_id=int(current_user.id), # type: ignore
        action=f"PORTFOLIO_{tx_type}_{symbol}"
    )
    db.add(audit)
    db.commit()
    db.refresh(db_tx)
    
    return db_tx

@router.get("/transactions", response_model=List[TransactionOut])
def get_transaction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.executed_at.desc()).all()
