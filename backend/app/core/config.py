"""Application settings loaded from environment variables / .env file."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = BACKEND_DIR / "priceradar.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "PriceRadar API"
    environment: str = "development"
    api_prefix: str = "/api"

    # Auth
    secret_key: str = "dev-secret-change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Database: SQLite by default (documented dev fallback), PostgreSQL in production.
    database_url: str = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    seed_demo_data: bool = True

    # CORS (frontend dev origin + preview hosts)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
    cors_origin_regex: str = r"https://[a-zA-Z0-9-]+\.e2b\.app"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Normalise common PostgreSQL URL schemes onto the psycopg2 driver."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
