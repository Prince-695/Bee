"""Bee API Core Configuration Module.

Loads validated environment settings via Pydantic BaseSettings.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

_REPO_ROOT = Path(__file__).resolve().parents[4]
_ENV_PATH = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    """Central validated settings for Bee API platform."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_PATH) if _ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── 1. Server & Swagger ────────────────────────────────────────────────
    PORT: int = Field(default=8000, validation_alias="PORT")
    DEBUG: bool = Field(default=False, validation_alias="DEBUG")
    ENVIRONMENT: str = Field(default="production", validation_alias="ENVIRONMENT")
    API_URL_SCHEME: str = Field(default="http", validation_alias="API_URL_SCHEME")
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://bee.dev",
        validation_alias="CORS_ALLOWED_ORIGINS",
    )
    SWAGGER_USERNAME: str = Field(default="admin", validation_alias="SWAGGER_USERNAME")
    SWAGGER_PASSWORD: str = Field(default="admin123", validation_alias="SWAGGER_PASSWORD")

    # ─── 2. Security & Token Lifecycles ─────────────────────────────────────
    JWT_SECRET: str = Field(
        default="5b275b987b4c1853a824dbe2e04d0b00be4154629af2faca0ad8c36f0882c4da",
        validation_alias="JWT_SECRET",
    )
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, validation_alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, validation_alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    TOKEN_ENCRYPTION_KEY: str = Field(
        default="c4b8fa87078d0710da47da4c7db80a83",
        validation_alias="TOKEN_ENCRYPTION_KEY",
    )

    # ─── 3. Database (PostgreSQL + SQLite fallback) ─────────────────────────
    DATABASE_URL: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")
    DATABASE_POOL_MIN_SIZE: int = Field(default=5, validation_alias="DATABASE_POOL_MIN_SIZE")
    DATABASE_POOL_MAX_SIZE: int = Field(default=20, validation_alias="DATABASE_POOL_MAX_SIZE")
    DB_PATH: str = Field(default="./bee.db", validation_alias="DB_PATH")

    # ─── 4. Central LLM Gateway ─────────────────────────────────────────────
    LLM_API_KEY: str = Field(default="", validation_alias="LLM_API_KEY")
    LLM_BASE_URL: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        validation_alias="LLM_BASE_URL",
    )
    LLM_MODEL: str = Field(default="gemini-2.5-flash", validation_alias="LLM_MODEL")
    LLM_TEMPERATURE: float = Field(default=0.7, validation_alias="LLM_TEMPERATURE")
    LLM_MAX_TOKENS: int = Field(default=8192, validation_alias="LLM_MAX_TOKENS")

    # ─── 5. Core OAuth Application Credentials ──────────────────────────────
    GOOGLE_CLIENT_ID: str = Field(default="", validation_alias="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", validation_alias="GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID: str = Field(default="", validation_alias="GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str = Field(default="", validation_alias="GITHUB_CLIENT_SECRET")

    # ─── 6. Transactional Email & OTP ───────────────────────────────────────
    SMTP_HOST: Optional[str] = Field(default=None, validation_alias="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, validation_alias="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, validation_alias="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, validation_alias="SMTP_PASSWORD")
    SMTP_FROM: str = Field(default="Bee Security <security@bee.dev>", validation_alias="SMTP_FROM")

    # ─── 7. Stripe Billing & Subscriptions ──────────────────────────────────
    STRIPE_SECRET_KEY: Optional[str] = Field(default="", validation_alias="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default="", validation_alias="STRIPE_WEBHOOK_SECRET")


    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()


def get_settings() -> Settings:
    return settings

