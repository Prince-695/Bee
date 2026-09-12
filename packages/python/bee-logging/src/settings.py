from __future__ import annotations

import os
from pathlib import Path


def _log_file_path_setting() -> str:
    return os.getenv("LOG_FILE_PATH", "./bee.logs.jsonl").strip() or "./bee.logs.jsonl"


def _read_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name, "true" if default else "false").strip().lower()
    return value in {"1", "true", "yes", "on"}


LOG_FILE_PATH = _log_file_path_setting()
LOG_TERMINAL_ENABLED = _read_bool("LOG_TERMINAL_ENABLED", True)
LOG_TERMINAL_FORMAT = os.getenv("LOG_TERMINAL_FORMAT", "message").strip().lower()
LOG_TERMINAL_MIN_LEVEL = os.getenv("LOG_TERMINAL_MIN_LEVEL", "INFO").strip().upper()


def resolve_log_file_path() -> Path:
    resolved = Path(LOG_FILE_PATH).expanduser()
    if resolved.is_absolute():
        return resolved
    # Prefer apps/api cwd-relative path when running the gateway
    return Path.cwd() / resolved
