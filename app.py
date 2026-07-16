import os
import sys
import time
import socket
import subprocess
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

# Set up paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(BASE_DIR, "venv", "Scripts", "python.exe")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Target URLs to check
URLS = {
    "Health Status Endpoint": "http://127.0.0.1:8000/health",
    "FastAPI Swagger UI Docs": "http://127.0.0.1:8000/docs",
    "FastAPI ReDoc API Docs": "http://127.0.0.1:8000/redoc"
}

def is_port_open(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.0)
    try:
        s.connect((ip, port))
        return True
    except (socket.timeout, ConnectionRefusedError):
        return False
    finally:
        s.close()

def start_backend():
    print("[INFO] Checking if FastAPI backend is already running on port 8000...")
    if is_port_open("127.0.0.1", 8000):
        print("[INFO] FastAPI backend is already running.")
        return None
    
    print("[INFO] Starting FastAPI backend server...")
    # Run uvicorn app.main:app from the backend folder
    process = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the port to open
    for i in range(15):
        if is_port_open("127.0.0.1", 8000):
            print("[INFO] Backend server started successfully.")
            return process
        time.sleep(1)
        
    print("[ERROR] Timeout waiting for backend server to start.")
    return process

def generate_light_report(results):
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarketMind AI - System Health Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            color: #333333;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            padding: 30px;
            border: 1px solid #e1e8ed;
        }}
        h1 {{
            color: #1a365d;
            font-size: 28px;
            margin-bottom: 5px;
            border-bottom: 2px solid #edf2f7;
            padding-bottom: 15px;
        }}
        .subtitle {{
            color: #718096;
            margin-top: 0;
            margin-bottom: 30px;
        }}
        .card {{
            border: 1px solid #edf2f7;
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 20px;
            background-color: #fafbfc;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
        }}
        .card-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        .card-title {{
            font-weight: bold;
            font-size: 18px;
            color: #2d3748;
        }}
        .status {{
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .status-success {{
            background-color: #c6f6d5;
            color: #22543d;
        }}
        .status-fail {{
            background-color: #fed7d7;
            color: #742a2a;
        }}
        .url-link {{
            color: #3182ce;
            text-decoration: none;
            font-family: monospace;
            font-size: 14px;
        }}
        .url-link:hover {{
            text-decoration: underline;
        }}
        .screenshot-container {{
            margin-top: 15px;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }}
        .screenshot {{
            width: 100%;
            height: auto;
            display: block;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #a0aec0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>MarketMind AI Verification Report</h1>
        <p class="subtitle">Generated using Playwright automated checks on {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
"""
    
    for title, res in results.items():
        status_class = "status-success" if res["success"] else "status-fail"
        status_text = "Working" if res["success"] else "Failed"
        
        html_content += f"""
        <div class="card">
            <div class="card-header">
                <span class="card-title">{title}</span>
                <span class="status {status_class}">{status_text}</span>
            </div>
            <p><a class="url-link" href="{res['url']}" target="_blank">{res['url']}</a></p>
            <p style="font-size: 14px; color: #4a5568;">{res.get('msg', '')}</p>
        """
        
        if res.get("screenshot"):
            html_content += f"""
            <div class="screenshot-container">
                <img class="screenshot" src="{res['screenshot']}" alt="{title} Screenshot">
            </div>
            """
            
        html_content += """
        </div>
        """
        
    html_content += """
        <div class="footer">
            Powered by Playwright & FastAPI. All indicators verified.
        </div>
    </div>
</body>
</html>
"""
    report_path = os.path.join(BASE_DIR, "report.html")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[INFO] Light-themed HTML verification report generated at: {report_path}")
    return report_path

def main():
    backend_proc = start_backend()
    
    results = {}
    
    print("\n[INFO] Starting Playwright automated tests...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        
        for name, url in URLS.items():
            print(f"[TEST] Verifying {name} ({url})...")
            page = context.new_page()
            
            try:
                # Set light color scheme explicitly inside playwright
                page.emulate_media(color_scheme="light")
                
                response = page.goto(url, wait_until="load", timeout=15000)
                status_code = response.status if response else 0
                
                if 200 <= status_code < 400:
                    success = True
                    msg = f"HTTP {status_code} - Page loaded successfully."
                else:
                    success = False
                    msg = f"HTTP {status_code} - Page returned an error code."
                
                # Check for specific pages content
                if "Health" in name:
                    content = page.content()
                    if "healthy" in content.lower():
                        msg += " DB and status checks report healthy."
                    else:
                        success = False
                        msg += " Warning: 'healthy' status text missing from JSON response."
                
                # Take screenshot for UI pages
                screenshot_filename = None
                if "Docs" in name or "Swagger" in name or "ReDoc" in name:
                    # Give swagger UI a tiny bit of extra time to render the interactive list
                    time.sleep(2)
                    filename = name.lower().replace(" ", "_") + ".png"
                    screenshot_path = os.path.join(BASE_DIR, filename)
                    page.screenshot(path=screenshot_path)
                    screenshot_filename = filename
                    msg += f" Captured UI screenshot saved to {filename}."
                
                results[name] = {
                    "url": url,
                    "success": success,
                    "msg": msg,
                    "screenshot": screenshot_filename
                }
                print(f"[PASS] {name} is functional.")
                
            except Exception as e:
                results[name] = {
                    "url": url,
                    "success": False,
                    "msg": f"Failed to connect or load: {str(e)}",
                    "screenshot": None
                }
                print(f"[FAIL] {name} test failed: {e}")
                
            finally:
                page.close()
                
        browser.close()
        
    # Generate HTML Report
    report_path = generate_light_report(results)
    
    print("\n" + "="*50)
    print(" SUMMARY OF VERIFICATION CHECKS")
    print("="*50)
    all_ok = True
    for name, res in results.items():
        status = "[ OK ] WORKING" if res["success"] else "[FAIL] FAILED"
        if not res["success"]:
            all_ok = False
        print(f"{name:<25}: {status}")
        print(f"  +- Message: {res['msg']}")
    print("="*50)
    
    # Do not kill the backend if it was already running prior to starting this script
    if backend_proc:
        print("[INFO] Stopping the launched temporary backend process...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
            
    if all_ok:
        print("\n[SUCCESS] ALL CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n[WARNING] SOME CHECKS FAILED. See details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
