from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/test_market"
    SECRET_KEY: str = "dev-secret-key"
    JWT_SECRET_KEY: str = "jwt-dev-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_PAYMENT_CARD: str = "8600-XXXX-XXXX-XXXX"
    TELEGRAM_CARD_HOLDER: str = "ISM FAMILIYA"

    GOOGLE_CLIENT_ID: str = ""

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    UPLOAD_DIR: str = "uploads"

    FRONTEND_URL: str = "http://localhost:3000"
    ADMIN_URL: str = "http://localhost:5173"

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://test-market.uz",
        "https://www.test-market.uz",
        "https://admin.test-market.uz",
        "https://api.test-market.uz",
    ]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
