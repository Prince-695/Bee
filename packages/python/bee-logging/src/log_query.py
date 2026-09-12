from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from bee_logging.settings import resolve_log_file_path


def _log_file_path() -> Path:
    return resolve_log_file_path()


def _is_match(
    entry: dict[str, Any],
    level: str | None,
    subsystem: str | None,
    from_time: str | None,
) -> bool:
    if level is not None and str(entry.get("level", "")) != level:
        return False
    if subsystem is not None and str(entry.get("subsystem", "")) != subsystem:
        return False
    if from_time is not None and str(entry.get("timestamp", "")) < from_time:
        return False
    return True


async def query_logs(
    level: str | None = None,
    subsystem: str | None = None,
    from_time: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    try:
        max_limit = max(1, min(limit, 1000))
        log_path = _log_file_path()

        if not log_path.exists():
            return []

        matched_entries: list[dict[str, Any]] = []
        with log_path.open("r", encoding="utf-8") as log_file:
            for raw_line in log_file:
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    parsed = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(parsed, dict):
                    continue
                if not _is_match(parsed, level, subsystem, from_time):
                    continue
                matched_entries.append(parsed)

        matched_entries.sort(key=lambda entry: str(entry.get("timestamp", "")), reverse=True)
        return matched_entries[:max_limit]
    except Exception:
        return []