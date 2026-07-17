from fastapi import FastAPI
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, analysis, portfolio, watchlist, calculator, admin

# Create DB tables automatically on launch
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Stock & Crypto Market Intelligence Platform API",
    version="1.0.0"
)

# CORS configuration for frontend accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory is configured and mounted for static queries
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Sub-router mappings
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Chart Analysis"])
app.include_router(portfolio.router, prefix=f"{settings.API_V1_STR}/portfolio", tags=["Portfolio Manager"])
app.include_router(watchlist.router, prefix=f"{settings.API_V1_STR}/watchlist", tags=["Watchlist Manager"])
app.include_router(calculator.router, prefix=f"{settings.API_V1_STR}/calculator", tags=["Position Calculator"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin Controls"])

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Status"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": settings.DATABASE_URL.split("://")[0]
    }

# Serve the static frontend SPA — catch-all for any non-API route
STATIC_FRONTEND = Path(__file__).parent.parent / "static_frontend"

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if STATIC_FRONTEND.exists():
        file_path = STATIC_FRONTEND / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_FRONTEND / "index.html"))
    return {"detail": "Not found"}
