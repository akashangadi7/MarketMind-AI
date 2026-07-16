from fastapi import APIRouter, HTTPException
from app.schemas import CalculatorRequest, CalculatorResponse

router = APIRouter()

@router.post("", response_model=CalculatorResponse)
def calculate_position(req: CalculatorRequest):
    if req.entry_price <= 0:
        raise HTTPException(status_code=400, detail="Entry price must be greater than zero")
    if req.max_risk_pct <= 0 or req.max_risk_pct > 100:
        raise HTTPException(status_code=400, detail="Max risk percentage must be between 0% and 100%")
        
    price_diff = abs(req.entry_price - req.stop_loss)
    if price_diff == 0:
        raise HTTPException(status_code=400, detail="Entry price and stop loss cannot be identical")
        
    # Standard Position Sizing Calculation
    # Risk Amount = Capital * (Max Risk % / 100)
    risk_amount = req.available_capital * (req.max_risk_pct / 100.0)
    
    # Position Size (Units) = Risk Amount / Price Difference (Entry - Stop)
    position_size_units = risk_amount / price_diff
    
    # Capital Allocation = Position Size * Entry Price
    allocated_capital = position_size_units * req.entry_price
    capital_allocation_pct = (allocated_capital / req.available_capital) * 100.0 if req.available_capital > 0 else 0.0
    
    # Expected Profit = Units * (Target - Entry)
    expected_profit = position_size_units * (req.target_price - req.entry_price)
    
    # Risk Reward Ratio = (Target - Entry) / (Entry - Stop)
    # Ensure no division by zero
    rr_ratio = (req.target_price - req.entry_price) / price_diff if price_diff > 0 else 0.0
    
    return CalculatorResponse(
        position_size=round(position_size_units, 4),
        max_loss=round(risk_amount, 2),
        expected_profit=round(expected_profit, 2),
        risk_reward_ratio=round(rr_ratio, 2),
        capital_allocation_pct=round(capital_allocation_pct, 2)
    )
