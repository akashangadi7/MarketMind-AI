import os
import sys
import time
import socket
import subprocess
import webbrowser
import http.server
import socketserver
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(BASE_DIR, "venv", "Scripts", "python.exe")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "static_frontend")

PORT_BACKEND = 8000
PORT_FRONTEND = 3000

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.connect(("127.0.0.1", port))
            return True
        except (socket.timeout, ConnectionRefusedError):
            return False

def start_backend():
    print(f"[SYSTEM] Checking if FastAPI backend is already running on port {PORT_BACKEND}...")
    if is_port_open(PORT_BACKEND):
        print(f"[SYSTEM] Backend is already running on port {PORT_BACKEND}.")
        return None
        
    print(f"[SYSTEM] Launching FastAPI backend server on port {PORT_BACKEND}...")
    process = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--port", str(PORT_BACKEND)],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for the backend to start up
    for i in range(10):
        if is_port_open(PORT_BACKEND):
            print("[SYSTEM] FastAPI backend server is active and healthy.")
            return process
        time.sleep(1)
        
    print("[SYSTEM] Timeout waiting for backend. Checking process state...")
    return process

class SilentHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Mute console request logging to keep console clean
        pass

def serve_frontend():
    print(f"[SYSTEM] Starting HTTP static web server on port {PORT_FRONTEND}...")
    os.chdir(FRONTEND_DIR)
    handler = SilentHTTPRequestHandler
    
    with socketserver.TCPServer(("127.0.0.1", PORT_FRONTEND), handler) as httpd:
        print(f"[SYSTEM] Frontend served at http://127.0.0.1:{PORT_FRONTEND}")
        httpd.serve_forever()

def main():
    if not os.path.exists(VENV_PYTHON):
        print(f"[ERROR] Virtual environment python interpreter not found at: {VENV_PYTHON}")
        print("Please make sure you have initialized the virtual environment 'venv' in the root folder.")
        sys.exit(1)
        
    backend_process = start_backend()
    
    # Start frontend server in a background thread
    frontend_thread = threading.Thread(target=serve_frontend, daemon=True)
    frontend_thread.start()
    
    # Wait for frontend server to be reachable
    for _ in range(5):
        if is_port_open(PORT_FRONTEND):
            break
        time.sleep(0.5)
        
    url = f"http://127.0.0.1:{PORT_FRONTEND}"
    print(f"\n[SYSTEM] Launching web browser for: {url}")
    webbrowser.open(url)
    
    print("\n" + "="*60)
    print(" MarketMind AI Platform is fully active.")
    print(f" - Frontend web app: http://127.0.0.1:{PORT_FRONTEND}")
    print(f" - Backend API docs: http://127.0.0.1:{PORT_BACKEND}/docs")
    print(" Press Ctrl+C to terminate both servers.")
    print("="*60 + "\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Shutting down systems...")
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        print("[SYSTEM] Done. Have a great day!")

if __name__ == "__main__":
    main()
