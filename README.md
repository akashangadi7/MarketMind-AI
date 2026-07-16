# MarketMind AI - Enterprise Stock & Crypto Market Intelligence Platform

MarketMind AI is a production-ready, enterprise-grade web application combining AI-assisted chart interpretation, technical indicators analysis, portfolio managers, watchlists, risk-reward calculation, and administrative audit panels.

---

## Technical Architecture Overview

The system runs on a containerized, decoupled architecture:
1. **Frontend**: React SPA built with TypeScript and styled using modern Tailwind CSS accents. Data visualizations are rendered via Recharts, and API communication is piped via Axios.
2. **Backend**: Fast API (Python) serving a RESTful API layer. Database querying utilizes SQLAlchemy, data formatting uses Pydantic models, and token security is configured with bcrypt and python-jose.
3. **Database**: PostgreSQL database inside Docker Compose, falling back to a local SQLite database for quick stand-alone runs.
4. **AI Core**: Google Gemini Vision API (`gemini-2.5-flash`) executing structured JSON validations and technical analysis over uploaded chart images.

---

## Directory Schema

```text
├── backend/
│   ├── app/
│   │   ├── api/          # Route controllers (auth, analysis, portfolio, calculator, admin)
│   │   ├── core/         # Settings configuration, security utils, DB connect
│   │   ├── services/     # Gemini Vision API connector, market price fetchers
│   │   ├── models.py     # SQLAlchemy DB models
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── main.py       # FastAPI application initializers
│   ├── tests/            # Automated pytest unit cases
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/      # Global Authentication states
│   │   ├── pages/        # Dashboard, Upload Analyzer, Calculator, Portfolios, Watchlists
│   │   ├── services/     # Axios client configuration
│   │   ├── App.tsx       # Router controls and menu templates
│   │   ├── main.tsx
│   │   └── index.css     # Glassmorphic Tailwind directives
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Installation & Setup Instructions

### 1. Unified Run with Docker Compose
To build and run all services (PostgreSQL, Backend API, Frontend SPA, and Nginx proxy) together, run:

```bash
# Create local configuration file
copy .env.example .env

# Start containers
docker-compose up --build
```
The application will be accessible at: `http://localhost/` (Nginx port 80).

---

### 2. Manual Running (Local Standalone Development)
If you prefer running the systems standalone without Docker, the backend automatically sets up a local SQLite file database (`marketmind.db`) for convenience.

#### A. Backend Setup
Ensure Python 3.10+ is installed on your system.

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows

# Install packages
pip install -r requirements.txt

# Populate environment variables (optional, backend falls back automatically)
set SECRET_KEY=yoursecretphrase
set GEMINI_API_KEY=your_gemini_api_key_here

# Run Uvicorn dev server
uvicorn app.main:app --reload --port 8000
```
API docs will run at: `http://127.0.0.1:8000/docs`

#### B. Frontend Setup
Ensure Node.js 18+ is installed on your system.

```bash
cd frontend
npm install
npm run dev
```
The web dashboard will launch at: `http://localhost:5173/`

---

## Running Automated Tests

To verify backend core auth controllers and risk-reward calculators, execute:

```bash
cd backend
python -m pytest tests/
```
