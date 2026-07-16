import os
import uuid
import shutil
import csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models import User, Analysis, AuditLog
from app.schemas import AnalysisOut
from app.services.gemini_service import analyze_chart_image

router = APIRouter()

# Dynamic static uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def upload_chart(
    file: UploadFile = File(...),
    asset_symbol: str = Form(...),
    asset_type: str = Form("stock"),  # stock, crypto
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate File Extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Supported formats are: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    # 2. Check Size
    # Read a portion of file or read it fully and reset pointer
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB."
        )
    await file.seek(0)
    
    # 3. Create Unique Filename & Save
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file locally: {e}"
        )
        
    # 4. Trigger Gemini analysis — pass symbol & type so mock data is asset-specific
    analysis_result = analyze_chart_image(file_path, asset_symbol=asset_symbol, asset_type=asset_type)
    
    # Force the asset symbol to be what user passed if the analysis outputs "Unknown" or similar
    if not analysis_result.get("asset_symbol") or analysis_result.get("asset_symbol") == "Unknown":
        analysis_result["asset_symbol"] = asset_symbol.upper()
        
    # 5. Save record in database
    db_analysis = Analysis(
        user_id=current_user.id,
        asset_symbol=asset_symbol.upper(),
        asset_type=asset_type.lower(),
        chart_image_path=f"/{UPLOAD_DIR}/{unique_filename}",
        analysis_result=analysis_result,
        is_favorite=False
    )
    db.add(db_analysis)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"CHART_UPLOAD_{asset_symbol.upper()}"
    )
    db.add(audit)
    db.commit()
    db.refresh(db_analysis)
    
    return db_analysis

@router.get("/history", response_model=List[AnalysisOut])
def get_history(
    search: Optional[str] = None,
    asset_type: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    sort_by: str = "date_desc",  # date_desc, date_asc, symbol_asc
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)
    
    if search:
        query = query.filter(Analysis.asset_symbol.ilike(f"%{search}%"))
    if asset_type:
        query = query.filter(Analysis.asset_type == asset_type.lower())
    if is_favorite is not None:
        query = query.filter(Analysis.is_favorite == is_favorite)
        
    if sort_by == "date_desc":
        query = query.order_by(Analysis.created_at.desc())
    elif sort_by == "date_asc":
        query = query.order_by(Analysis.created_at.asc())
    elif sort_by == "symbol_asc":
        query = query.order_by(Analysis.asset_symbol.asc())
        
    return query.all()

@router.put("/{analysis_id}/favorite", response_model=AnalysisOut)
def toggle_favorite(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
        
    db_analysis.is_favorite = not db_analysis.is_favorite
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
        
    # Delete local file if it exists
    if db_analysis.chart_image_path:
        local_path = db_analysis.chart_image_path.lstrip("/")
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass
                
    db.delete(db_analysis)
    db.commit()
    return None

@router.get("/{analysis_id}/export/csv")
def export_csv(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
        
    res = db_analysis.analysis_result
    
    # Generate CSV in memory
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow(["Parameter", "Value"])
    writer.writerow(["Asset Symbol", db_analysis.asset_symbol])
    writer.writerow(["Asset Type", db_analysis.asset_type])
    writer.writerow(["Date Analyzed", db_analysis.created_at.isoformat()])
    writer.writerow(["Confidence Score", res.get("confidence_score")])
    writer.writerow(["Trend Direction", res.get("technical_observations", {}).get("trend_direction")])
    writer.writerow(["Trend Strength", res.get("technical_observations", {}).get("trend_strength")])
    writer.writerow(["Bullish Probability (%)", res.get("probability_analysis", {}).get("bullish")])
    writer.writerow(["Bearish Probability (%)", res.get("probability_analysis", {}).get("bearish")])
    writer.writerow(["Sideways Probability (%)", res.get("probability_analysis", {}).get("sideways")])
    writer.writerow(["Support Levels", ", ".join(map(str, res.get("support_resistance", {}).get("support_levels", [])))])
    writer.writerow(["Resistance Levels", ", ".join(map(str, res.get("support_resistance", {}).get("resistance_levels", [])))])
    
    # Return as Streaming Response
    f.seek(0)
    response = StreamingResponse(iter([f.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=analysis_{db_analysis.asset_symbol}_{analysis_id}.csv"
    return response

@router.get("/{analysis_id}/export/pdf")
def export_pdf_report(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
        
    res = db_analysis.analysis_result
    
    # We yield a highly formatted text/markdown printable document that functions as the printable report
    report_text = f"""==================================================
MARKETMIND AI - ENTERPRISE TECHNICAL INTELLIGENCE
==================================================
Report Generated: {db_analysis.created_at.strftime('%Y-%m-%d %H:%M:%S')}
Asset Symbol: {db_analysis.asset_symbol}
Asset Type: {db_analysis.asset_type.upper()}
Confidence Level: {res.get('confidence_score')}%

--------------------------------------------------
EXECUTIVE SUMMARY:
{res.get('executive_summary')}

--------------------------------------------------
TECHNICAL ANALYSIS OBSERVATIONS:
- Trend: {res.get('technical_observations', {}).get('trend_direction')} ({res.get('technical_observations', {}).get('trend_strength')})
- Candlestick Patterns: {', '.join(res.get('technical_observations', {}).get('candlestick_patterns', []))}
- Chart Patterns: {', '.join(res.get('technical_observations', {}).get('chart_patterns', []))}
- Volatility: {res.get('technical_observations', {}).get('volatility')}
- Indicators Momentum: {res.get('technical_observations', {}).get('momentum')}

--------------------------------------------------
SCENARIO ESTIMATION:
* Bullish Path: {res.get('probability_analysis', {}).get('bullish')}%
* Bearish Path: {res.get('probability_analysis', {}).get('bearish')}%
* Sideways Range: {res.get('probability_analysis', {}).get('sideways')}%
Justification: {res.get('probability_analysis', {}).get('explanation')}

--------------------------------------------------
KEY PRICE BANDS:
- Support Levels: {', '.join(map(str, res.get('support_resistance', {}).get('support_levels', [])))}
- Resistance Levels: {', '.join(map(str, res.get('support_resistance', {}).get('resistance_levels', [])))}

--------------------------------------------------
RISK ASSESSMENT & STRATEGY:
- Risk Factors: {'; '.join(res.get('opportunity_risk', {}).get('risk_factors', []))}
- Market Opportunities: {'; '.join(res.get('opportunity_risk', {}).get('opportunities', []))}
- Suggested Position Sizing & Stop Guidelines:
  {res.get('opportunity_risk', {}).get('suggested_risk_management')}

--------------------------------------------------
EDUCATIONAL CONTEXT:
{res.get('educational_explanation')}

==================================================
DISCLAIMER:
This report is AI-assisted and for educational purposes only. It is not financial advice.
==================================================
"""
    
    response = StreamingResponse(iter([report_text]), media_type="text/plain")
    response.headers["Content-Disposition"] = f"attachment; filename=report_{db_analysis.asset_symbol}_{analysis_id}.txt"
    return response
