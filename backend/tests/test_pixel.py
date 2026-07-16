import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from app.services.gemini_service import analyze_chart_pixels, build_analysis_from_pixels

test_images = [
    ('../dashboard_preview.png', 'ETH', 'crypto'),
    ('../login_enhanced.png',    'BTC', 'crypto'),
]

for img_path, sym, atype in test_images:
    if not os.path.exists(img_path):
        print(f"SKIP: {img_path} not found")
        continue
    px   = analyze_chart_pixels(img_path)
    full = build_analysis_from_pixels(px, sym, atype, img_path)
    trend = full["technical_observations"]["trend_direction"]
    strn  = full["technical_observations"]["trend_strength"]
    candles = full["technical_observations"]["candlestick_patterns"]
    probs = full["probability_analysis"]
    print(f"=== {sym} ===")
    print(f"Trend  : {trend} ({strn})")
    print(f"RSI    : {px['rsi_estimate']}  Slope: {px['slope_score']:+.2f}  Vol: {px['volatility_label']}")
    print(f"Candles: {candles}")
    print(f"Probs  : Bull={probs['bullish']}% Bear={probs['bearish']}% Side={probs['sideways']}%")
    print(f"Summary: {full['executive_summary'][:130]}")
    print()
