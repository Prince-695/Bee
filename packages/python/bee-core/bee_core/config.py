from __future__ import annotations

import os
from pathlib import Path
from typing import Final

from dotenv import load_dotenv

# Repo root: packages/python/bee-core/bee_core/config.py -> parents[4]
_REPO_ROOT = Path(__file__).resolve().parents[4]
_API_ROOT = _REPO_ROOT / "apps" / "api"
_HIVE_LOCAL = _REPO_ROOT / "tools" / "hive-local"

# Single source of truth: root .env
load_dotenv(_REPO_ROOT / ".env", override=True)


def _read_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _read_bool(name: str, default: bool = False) -> bool:
    value = _read_env(name, "true" if default else "false").lower()
    return value in {"1", "true", "yes", "on"}


def _read_int(name: str, default: int) -> int:
    raw = _read_env(name, str(default))
    try:
        return int(raw)
    except ValueError:
        return default


def _read_float(name: str, default: float) -> float:
    raw = _read_env(name, str(default))
    try:
        return float(raw)
    except ValueError:
        return default


def _read_csv(name: str, default: str) -> list[str]:
    raw_value = _read_env(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _read_env_any(*names: str, default: str = "") -> str:
    for name in names:
        value = _read_env(name)
        if value:
            return value
    return default


CORS_ALLOWED_ORIGINS: Final[list[str]] = _read_csv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
DEBUG: Final[bool] = _read_bool("DEBUG", False)

DB_PATH: Final[str] = _read_env("DB_PATH", str(_API_ROOT / "bee.db"))

LOG_FILE_PATH: Final[str] = _read_env("LOG_FILE_PATH", str(_API_ROOT / "bee.logs.jsonl"))
LOG_TERMINAL_ENABLED: Final[bool] = _read_bool("LOG_TERMINAL_ENABLED", True)
LOG_TERMINAL_FORMAT: Final[str] = _read_env("LOG_TERMINAL_FORMAT", "message").lower()
LOG_TERMINAL_MIN_LEVEL: Final[str] = _read_env("LOG_TERMINAL_MIN_LEVEL", "INFO").upper()

LLM_API_KEY: Final[str] = _read_env_any("LLM_API_KEY", "NVIDIA_API_KEY")
LLM_BASE_URL: Final[str] = _read_env(
    "LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"
)
LLM_MODEL: Final[str] = _read_env("LLM_MODEL", "nvidia/nemotron-3-super-120b-a12b")
LLM_TEMPERATURE: Final[float] = _read_float("LLM_TEMPERATURE", 1.0)
LLM_TOP_P: Final[float] = _read_float("LLM_TOP_P", 0.95)
LLM_MAX_TOKENS: Final[int] = _read_int("LLM_MAX_TOKENS", 16384)
LLM_REASONING_BUDGET: Final[int] = _read_int("LLM_REASONING_BUDGET", 16384)
LLM_ENABLE_THINKING: Final[bool] = _read_bool("LLM_ENABLE_THINKING", True)

def mask_secret(value: str) -> str:
    """Safely mask sensitive secrets and API keys for logs and diagnostics."""
    if not value:
        return ""
    val_str = str(value).strip()
    if len(val_str) <= 8:
        return "********"
    return f"{val_str[:3]}...{val_str[-4:]}"


def validate_environment() -> dict:
    """Validate environment configuration and detect security weaknesses."""
    issues: list[str] = []
    jwt_secret = os.getenv("JWT_SECRET", "")
    is_insecure_jwt = False

    if not jwt_secret or "change_me" in jwt_secret or len(jwt_secret) < 32:
        is_insecure_jwt = True
        if not DEBUG:
            issues.append("CRITICAL: JWT_SECRET is weak, default, or under 32 characters in production.")

    if not LLM_API_KEY:
        issues.append("WARNING: LLM_API_KEY is not configured; AI agent inference will be disabled.")

    if "*" in CORS_ALLOWED_ORIGINS:
        issues.append("SECURITY: Wildcard '*' found in CORS_ALLOWED_ORIGINS with credentials enabled.")

    return {
        "debug_mode": DEBUG,
        "database_path": DB_PATH,
        "is_insecure_jwt": is_insecure_jwt,
        "cors_origins": CORS_ALLOWED_ORIGINS,
        "issues": issues,
        "healthy": len([i for i in issues if i.startswith("CRITICAL")]) == 0,
    }


REPO_ROOT: Final[Path] = _REPO_ROOT
API_ROOT: Final[Path] = _API_ROOT
HIVE_LOCAL_ROOT: Final[Path] = _HIVE_LOCAL
