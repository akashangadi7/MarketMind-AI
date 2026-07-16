from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime
from typing import Optional
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="retail", nullable=False)  # admin, analyst, trader, retail
    is_active = Column(Boolean, default=True, nullable=False)
    mfa_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    portfolio_assets = relationship("PortfolioAsset", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_symbol = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)  # stock, crypto
    chart_image_path = Column(String, nullable=True)
    analysis_result = Column(JSON, nullable=False)  # Contains trend, levels, probability, metrics
    is_favorite = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="analyses")

class PortfolioAsset(Base):
    __tablename__ = "portfolio_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)  # stock, crypto
    shares_quantity = Column(Float, default=0.0, nullable=False)
    average_buy_price = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="portfolio_assets")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    type = Column(String, nullable=False)  # BUY, SELL
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="transactions")

class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol: Mapped[str] = Column(String, nullable=False)
    asset_type: Mapped[str] = Column(String, nullable=False)  # stock, crypto
    notes: Mapped[Optional[str]] = Column(Text, nullable=True)
    tags: Mapped[Optional[str]] = Column(String, nullable=True)  # Comma separated values, e.g. "tech,growth"
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="watchlists")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "USER_LOGIN", "CHART_UPLOAD"
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="audit_logs")
