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
        live_price = get_live_price(asset.symbol, asset.asset_type) or asset.average_buy_price
        
        current_value = asset.shares_quantity * live_price
        cost_basis = asset.shares_quantity * asset.average_buy_price
        p_l = current_value - cost_basis
        p_l_pct = (p_l / cost_basis * 100.0) if cost_basis > 0 else 0.0
        
        enriched_assets.append(
            PortfolioAssetOut(
                id=asset.id,
                symbol=asset.symbol,
                asset_type=asset.asset_type,
                shares_quantity=asset.shares_quantity,
                average_buy_price=asset.average_buy_price,
                current_price=live_price,
                current_value=current_value,
                profit_loss=p_l,
                profit_loss_pct=p_l_pct
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
                user_id=current_user.id,
                symbol=symbol,
                asset_type=asset_type,
                shares_quantity=tx_in.quantity,
                average_buy_price=tx_in.price
            )
            db.add(asset)
        else:
            # Re-calculate average buy price
            total_shares = asset.shares_quantity + tx_in.quantity
            total_cost = (asset.shares_quantity * asset.average_buy_price) + (tx_in.quantity * tx_in.price)
            asset.average_buy_price = total_cost / total_shares if total_shares > 0 else 0
            asset.shares_quantity = total_shares
    else:  # SELL
        if not asset or asset.shares_quantity < tx_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient holdings to sell {tx_in.quantity} of {symbol}. Current holdings: {asset.shares_quantity if asset else 0}"
            )
        
        asset.shares_quantity -= tx_in.quantity
        if asset.shares_quantity <= 0:
            db.delete(asset)

    # Save transaction
    db_tx = Transaction(
        user_id=current_user.id,
        symbol=symbol,
        type=tx_type,
        quantity=tx_in.quantity,
        price=tx_in.price
    )
    db.add(db_tx)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
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
