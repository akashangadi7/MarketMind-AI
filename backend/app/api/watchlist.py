from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Watchlist
from app.schemas import WatchlistCreate, WatchlistOut
from app.services.market_service import get_live_price

router = APIRouter()

@router.get("", response_model=List[WatchlistOut])
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()

@router.get("/prices")
def get_watchlist_prices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    prices = {}
    for item in items:
        prices[item.symbol] = get_live_price(item.symbol, item.asset_type) or 100.0
    return prices

@router.post("", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    item: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already watchlisted
    symbol = item.symbol.strip().upper()
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == symbol
    ).first()
    
    if existing:
         raise HTTPException(status_code=400, detail=f"{symbol} is already in your watchlist.")

    db_item = Watchlist(
        user_id=current_user.id,
        symbol=symbol,
        asset_type=item.asset_type,
        notes=item.notes,
        tags=item.tags
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=WatchlistOut)
def update_watchlist_item(
    item_id: int,
    notes: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
        
    if notes is not None:
        db_item.notes = notes
    if tags is not None:
        db_item.tags = tags
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
        
    db.delete(db_item)
    db.commit()
    return None
