"""Bee API config — loads env and re-exports core + Hive Registry settings."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

_API_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_API_DIR / ".env", override=True)

from bee_core.config import (  # noqa: E402
    CORS_ALLOWED_ORIGINS,
    DB_PATH,
    DEBUG,
    LLM_API_KEY,
    LLM_BASE_URL,
    LLM_ENABLE_THINKING,
    LLM_MAX_TOKENS,
    LLM_MODEL,
    LLM_REASONING_BUDGET,
    LLM_TEMPERATURE,
    LLM_TOP_P,
    LOG_FILE_PATH,
    LOG_TERMINAL_ENABLED,
    LOG_TERMINAL_FORMAT,
    LOG_TERMINAL_MIN_LEVEL,
)
from bee_hive.registry import HIVE_REGISTRY, MCP_PYTHON_BIN, MCP_SERVERS  # noqa: E402

__all__ = [
    "CORS_ALLOWED_ORIGINS",
    "DB_PATH",
    "DEBUG",
    "HIVE_REGISTRY",
    "LLM_API_KEY",
    "LLM_BASE_URL",
    "LLM_ENABLE_THINKING",
    "LLM_MAX_TOKENS",
    "LLM_MODEL",
    "LLM_REASONING_BUDGET",
    "LLM_TEMPERATURE",
    "LLM_TOP_P",
    "LOG_FILE_PATH",
    "LOG_TERMINAL_ENABLED",
    "LOG_TERMINAL_FORMAT",
    "LOG_TERMINAL_MIN_LEVEL",
    "MCP_PYTHON_BIN",
    "MCP_SERVERS",
]
