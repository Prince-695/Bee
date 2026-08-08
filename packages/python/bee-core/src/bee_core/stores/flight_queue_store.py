"""Durable deferred Flight queue backed by SQLite."""

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


def init_flight_queue_db() -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS flight_queue (
                    id TEXT PRIMARY KEY,
                    user_prompt TEXT NOT NULL,
                    status TEXT NOT NULL,
                    webhook_type TEXT,
                    webhook_filter_json TEXT,
                    event_data_json TEXT,
                    route_id TEXT,
                    result_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    claimed_at TEXT
                )
                """
            )
            connection.commit()


def enqueue_deferred_flight(
    user_prompt: str,
    webhook_type: str,
    webhook_filter: dict[str, Any],
    task_id: str | None = None,
) -> dict[str, Any]:
    record_id = task_id or str(uuid.uuid4())[:8]
    now = _utc_now_iso()
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                INSERT INTO flight_queue (
                    id, user_prompt, status, webhook_type, webhook_filter_json,
                    event_data_json, route_id, result_json, created_at, updated_at, claimed_at
                ) VALUES (?, ?, 'waiting', ?, ?, NULL, NULL, NULL, ?, ?, NULL)
                """,
                (
                    record_id,
                    user_prompt,
                    webhook_type,
                    json.dumps(webhook_filter, ensure_ascii=False),
                    now,
                    now,
                ),
            )
            connection.commit()
    return get_flight_task(record_id) or {"id": record_id, "status": "waiting"}


def mark_flight_ready(task_id: str, event_data: dict[str, Any]) -> dict[str, Any] | None:
    now = _utc_now_iso()
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                UPDATE flight_queue
                SET status = 'ready', event_data_json = ?, updated_at = ?
                WHERE id = ? AND status = 'waiting'
                """,
                (json.dumps(event_data, ensure_ascii=False), now, task_id),
            )
            connection.commit()
    return get_flight_task(task_id)


def _claim_task(connection: sqlite3.Connection, task_id: str, now: str) -> bool:
    cursor = connection.execute(
        """
        UPDATE flight_queue
        SET status = 'flying', claimed_at = ?, updated_at = ?
        WHERE id = ? AND status = 'ready'
        """,
        (now, now, task_id),
    )
    return cursor.rowcount > 0


def claim_flight_by_id(task_id: str) -> dict[str, Any] | None:
    now = _utc_now_iso()
    with _DB_LOCK:
        with _get_connection() as connection:
            if not _claim_task(connection, task_id, now):
                return None
            connection.commit()
    return get_flight_task(task_id)


def claim_next_ready_flight() -> dict[str, Any] | None:
    now = _utc_now_iso()
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                """
                SELECT id FROM flight_queue
                WHERE status = 'ready'
                ORDER BY datetime(created_at) ASC
                LIMIT 1
                """
            ).fetchone()
            if row is None:
                return None
            if not _claim_task(connection, row["id"], now):
                return None
            connection.commit()
            task_id = row["id"]
    return get_flight_task(task_id)


def complete_flight_task(
    task_id: str,
    *,
    route_id: str | None,
    result: dict[str, Any] | None,
    failed: bool = False,
) -> None:
    now = _utc_now_iso()
    status = "failed" if failed else "done"
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                UPDATE flight_queue
                SET status = ?, route_id = ?, result_json = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    status,
                    route_id,
                    json.dumps(result, ensure_ascii=False) if result is not None else None,
                    now,
                    task_id,
                ),
            )
            connection.commit()


def list_flight_tasks(limit: int = 100) -> list[dict[str, Any]]:
    with _DB_LOCK:
        with _get_connection() as connection:
            rows = connection.execute(
                """
                SELECT * FROM flight_queue
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (max(1, min(limit, 500)),),
            ).fetchall()
    return [_row_to_task(row) for row in rows]


def get_flight_task(task_id: str) -> dict[str, Any] | None:
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                "SELECT * FROM flight_queue WHERE id = ?", (task_id,)
            ).fetchone()
    if row is None:
        return None
    return _row_to_task(row)


def _row_to_task(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["webhook_filter"] = (
        json.loads(data.pop("webhook_filter_json") or "{}")
    )
    data["event_data"] = (
        json.loads(data.pop("event_data_json"))
        if data.get("event_data_json")
        else None
    )
    data.pop("event_data_json", None)
    data["result"] = (
        json.loads(data.pop("result_json")) if data.get("result_json") else None
    )
    data.pop("result_json", None)
    return data
