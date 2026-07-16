import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MarketMind AI"
    API_V1_STR: str = "/api/v1"
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeymarketmindai123456!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./marketmind.db")

    # AI Vision Integration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Allowed Upload File Extensions
    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "webp"}
    MAX_FILE_SIZE_MB: int = 5  # 5 Megabytes

    class Config:
        case_sensitive = True

settings = Settings()
