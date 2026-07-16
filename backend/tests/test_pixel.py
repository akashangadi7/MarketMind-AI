import os
from PIL import Image
from app.services.gemini_service import analyze_chart_pixels, build_result

def test_pixel_analyzer_execution():
    # Setup: Create a temporary test image if none exists
    temp_img = "test_temp_chart.png"
    img = Image.new('RGB', (400, 300), color=(50, 150, 50))  # Green-dominant image
    img.save(temp_img)
    
    try:
        # Run local pixel analysis
        metrics = analyze_chart_pixels(temp_img)
        assert "trend" in metrics
        assert "rsi" in metrics
        assert "slope" in metrics
        assert "vol_lbl" in metrics
        
        # Test full report generation
        report = build_result(metrics, "ETH", "Ethereum", "crypto")
        assert report["asset_symbol"] == "ETH"
        assert "executive_summary" in report
        assert "technical_observations" in report
        assert report["technical_observations"]["trend_direction"] in ["Bullish", "Bearish", "Sideways"]
        assert "support_resistance" in report
        
    finally:
        # Clean up temporary test image
        if os.path.exists(temp_img):
            os.remove(temp_img)
