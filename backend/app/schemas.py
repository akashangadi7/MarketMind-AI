from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "retail"  # admin, analyst, trader, retail

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Gemini Chart Analysis JSON Schemas ---
class ProbabilityAnalysis(BaseModel):
    bullish: float = Field(..., description="Bullish scenario probability percentage (e.g. 68.0)")
    bearish: float = Field(..., description="Bearish scenario probability percentage (e.g. 22.0)")
    sideways: float = Field(..., description="Sideways scenario probability percentage (e.g. 10.0)")
    explanation: str = Field(..., description="Details and factors driving these scenario percentages")

class SupportResistance(BaseModel):
    support_levels: List[float] = Field(..., description="Identified support levels")
    resistance_levels: List[float] = Field(..., description="Identified resistance levels")

class TechnicalObservations(BaseModel):
    trend_direction: str = Field(..., description="Overall trend (Bullish, Bearish, Sideways)")
    trend_strength: str = Field(..., description="Strength of the trend (Strong, Moderate, Weak)")
    candlestick_patterns: List[str] = Field(..., description="Observed candlestick formations")
    chart_patterns: List[str] = Field(..., description="Observed chart formations (e.g., Head & Shoulders, Double Bottom)")
    momentum: str = Field(..., description="Indicator momentum analysis (RSI, MACD details if visible)")
    volatility: str = Field(..., description="Volatility analysis (e.g., Bollinger bands, price ranges)")
    key_signals: List[str] = Field(..., description="Key technical indicators or triggers observed")

class OpportunityRisk(BaseModel):
    risk_factors: List[str] = Field(..., description="Risk factors in the current structure")
    opportunities: List[str] = Field(..., description="Identified triggers or entry options")
    suggested_risk_management: str = Field(..., description="Suggested position sizing or stop guidelines")

class ChartAnalysisResult(BaseModel):
    asset_symbol: str = Field("Unknown", description="Symbol of the asset analyzed")
    confidence_score: float = Field(..., description="Confidence rating from 0.0 to 100.0")
    executive_summary: str = Field(..., description="High-level overview of the chart's overall state")
    technical_observations: TechnicalObservations
    support_resistance: SupportResistance
    probability_analysis: ProbabilityAnalysis
    opportunity_risk: OpportunityRisk
    educational_explanation: str = Field(..., description="Short explanation of indicators or patterns found to educate the user")

class AnalysisOut(BaseModel):
    id: int
    asset_symbol: str
    asset_type: str
    chart_image_path: Optional[str]
    analysis_result: ChartAnalysisResult
    is_favorite: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Watchlist Schemas ---
class WatchlistBase(BaseModel):
    symbol: str
    asset_type: str  # stock, crypto
    notes: Optional[str] = None
    tags: Optional[str] = None

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistOut(WatchlistBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transaction & Portfolio Schemas ---
class TransactionCreate(BaseModel):
    symbol: str
    type: str  # BUY, SELL
    quantity: float
    price: float

class TransactionOut(TransactionCreate):
    id: int
    user_id: int
    executed_at: datetime

    class Config:
        from_attributes = True

class PortfolioAssetOut(BaseModel):
    id: int
    symbol: str
    asset_type: str
    shares_quantity: float
    average_buy_price: float
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    profit_loss: Optional[float] = None
    profit_loss_pct: Optional[float] = None

    class Config:
        from_attributes = True

# --- Investment Calculator Schemas ---
class CalculatorRequest(BaseModel):
    available_capital: float
    entry_price: float
    stop_loss: float
    target_price: float
    max_risk_pct: float

class CalculatorResponse(BaseModel):
    position_size: float
    max_loss: float
    expected_profit: float
    risk_reward_ratio: float
    capital_allocation_pct: float

# --- Admin Schemas ---
class SystemAuditLog(BaseModel):
    id: int
    user_id: Optional[int]
    email: Optional[str]
    action: str
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class SystemStats(BaseModel):
    total_users: int
    active_users: int
    total_analyses: int
    saved_reports: int
    average_confidence: float
