from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bee_core.config import DB_PATH

_DB_LOCK = threading.Lock()


def _db_path() -> Path:
    return Path(DB_PATH).expanduser()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_connection() -> sqlite3.Connection:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path), check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def _table_columns(connection: sqlite3.Connection, table: str) -> set[str]:
    rows = connection.execute(f"PRAGMA table_info({table})").fetchall()
    return {str(row[1]) for row in rows}


def _migrate_chats(connection: sqlite3.Connection) -> None:
    cols = _table_columns(connection, "chats")
    if not cols:
        return
    if "plan_id" in cols and "route_id" not in cols:
        connection.execute("ALTER TABLE chats RENAME COLUMN plan_id TO route_id")
    if "plan_json" in cols and "route_json" not in cols:
        connection.execute("ALTER TABLE chats RENAME COLUMN plan_json TO route_json")


def init_db() -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    route_id TEXT,
                    route_json TEXT,
                    result_json TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                )
                """
            )
            _migrate_chats(connection)
            connection.commit()


def save_chat(
    prompt: str,
    route: dict[str, Any] | None,
    result: dict[str, Any] | None,
    status: str,
    chat_id: str | None = None,
    route_id: str | None = None,
) -> dict[str, Any]:
    """Create or update a chat record."""
    record_id = chat_id or (route_id if route_id else str(uuid.uuid4())[:8])
    now_iso = _utc_now_iso()
    completed_at = now_iso if status in {"completed", "failed"} else None
    route_json = json.dumps(route, ensure_ascii=False) if route is not None else None
    result_json = json.dumps(result, ensure_ascii=False) if result is not None else None

    with _DB_LOCK:
        with _get_connection() as connection:
            existing = connection.execute(
                "SELECT id, prompt, created_at FROM chats WHERE id = ?",
                (record_id,),
            ).fetchone()

            if existing is None:
                connection.execute(
                    """
                    INSERT INTO chats (id, prompt, route_id, route_json, result_json, status, created_at, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        record_id,
                        prompt,
                        route_id or record_id,
                        route_json,
                        result_json,
                        status,
                        now_iso,
                        completed_at,
                    ),
                )
            else:
                connection.execute(
                    """
                    UPDATE chats
                    SET
                        prompt = ?,
                        route_id = ?,
                        route_json = COALESCE(?, route_json),
                        result_json = COALESCE(?, result_json),
                        status = ?,
                        completed_at = CASE
                            WHEN ? IS NOT NULL THEN ?
                            ELSE completed_at
                        END
                    WHERE id = ?
                    """,
                    (
                        prompt or existing["prompt"],
                        route_id or record_id,
                        route_json,
                        result_json,
                        status,
                        completed_at,
                        completed_at,
                        record_id,
                    ),
                )

            connection.commit()

    chat = get_chat(record_id)
    if chat is None:
        raise RuntimeError(f"Failed to persist chat {record_id}")
    return chat


def get_chats(limit: int = 50) -> list[dict[str, Any]]:
    safe_limit = max(1, min(limit, 500))
    with _DB_LOCK:
        with _get_connection() as connection:
            rows = connection.execute(
                """
                SELECT id, prompt, route_id, status, created_at, completed_at
                FROM chats
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()

    return [dict(row) for row in rows]


def get_chat(chat_id: str) -> dict[str, Any] | None:
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, prompt, route_id, route_json, result_json, status, created_at, completed_at
                FROM chats
                WHERE id = ?
                """,
                (chat_id,),
            ).fetchone()

    if row is None:
        return None

    record = dict(row)
    route_json = record.get("route_json")
    result_json = record.get("result_json")
    record["route_json"] = (
        json.loads(route_json) if isinstance(route_json, str) and route_json else None
    )
    record["result_json"] = (
        json.loads(result_json) if isinstance(result_json, str) and result_json else None
    )
    return record
