"""
Application configuration module.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    APP_NAME: str = "Distributed Job Scheduler"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ------------------------------------------------------------------
    # Server
    # ------------------------------------------------------------------
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"

    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def build_database_url(cls, value, info):
        if value:
            return value

        data = info.data

        return (
            f"postgresql+asyncpg://"
            f"{data.get('DB_USER')}:"
            f"{data.get('DB_PASSWORD')}@"
            f"{data.get('DB_HOST')}:"
            f"{data.get('DB_PORT')}/"
            f"{data.get('DB_NAME')}"
        )

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self):
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()