from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models import User, Analysis, AuditLog
from app.schemas import SystemStats, SystemAuditLog, UserOut

router = APIRouter()

@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_analyses = db.query(Analysis).count()
    saved_reports = db.query(Analysis).filter(Analysis.is_favorite == True).count()
    
    # Calculate average confidence
    analyses = db.query(Analysis).all()
    avg_conf = 0.0
    if analyses:
        total_conf = 0.0
        for a in analyses:
            # Safe read of confidence score from json
            res = a.analysis_result
            if isinstance(res, dict):
                total_conf += float(res.get("confidence_score") or 0)
        avg_conf = total_conf / len(analyses)
        
    return SystemStats(
        total_users=total_users,
        active_users=active_users,
        total_analyses=total_analyses,
        saved_reports=saved_reports,
        average_confidence=round(avg_conf, 1)
    )

@router.get("/logs", response_model=List[SystemAuditLog])
def get_audit_logs(
    limit: int = 100,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    enriched_logs = []
    for log in logs:
        # Fetch email for audit trace
        user_email = None
        if log.user_id:
            user = db.query(User).filter(User.id == log.user_id).first()
            user_email = user.email if user else None
            
        enriched_logs.append(
            SystemAuditLog(
                id=log.id,
                user_id=log.user_id,
                email=user_email,
                action=log.action,
                ip_address=log.ip_address,
                timestamp=log.timestamp
            )
        )
    return enriched_logs

@router.get("/users", response_model=List[UserOut])
def list_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.put("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own administrative account")
        
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/role", response_model=UserOut)
def change_user_role(
    user_id: int,
    role: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if role not in ["admin", "analyst", "trader", "retail"]:
         raise HTTPException(status_code=400, detail="Invalid role specification")
         
    user.role = role
    db.commit()
    db.refresh(user)
    return user
