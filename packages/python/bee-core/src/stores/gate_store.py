"""Approval Gate store — persistent storage for human-in-the-loop gates."""

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


def init_gate_db() -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS gates (
                    id TEXT PRIMARY KEY,
                    route_id TEXT NOT NULL,
                    step_num INTEGER NOT NULL,
                    server TEXT NOT NULL,
                    tool TEXT NOT NULL,
                    args_json TEXT NOT NULL,
                    action_summary TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    resolved_at TEXT
                )
                """
            )
            connection.commit()


def create_gate(
    route_id: str,
    step_num: int,
    server: str,
    tool: str,
    args: dict[str, Any],
    action_summary: str,
) -> dict[str, Any]:
    """Create a pending approval gate."""
    init_gate_db()
    gate_id = str(uuid.uuid4())[:8]
    now_iso = _utc_now_iso()
    args_json = json.dumps(args, ensure_ascii=False)

    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                INSERT INTO gates (id, route_id, step_num, server, tool, args_json, action_summary, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                """,
                (gate_id, route_id, step_num, server, tool, args_json, action_summary, now_iso),
            )
            connection.commit()

    return {
        "gate_id": gate_id,
        "route_id": route_id,
        "step_num": step_num,
        "server": server,
        "tool": tool,
        "args": args,
        "action_summary": action_summary,
        "status": "pending",
        "created_at": now_iso,
        "resolved_at": None,
    }


def get_gate(gate_id: str) -> dict[str, Any] | None:
    init_gate_db()
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                "SELECT * FROM gates WHERE id = ?",
                (gate_id,),
            ).fetchone()

    if row is None:
        return None

    record = dict(row)
    args_raw = record.get("args_json", "{}")
    try:
        record["args"] = json.loads(args_raw)
    except Exception:
        record["args"] = {}
    return record


def resolve_gate(gate_id: str, status: str) -> dict[str, Any] | None:
    """Approve or reject a pending gate."""
    if status not in {"approved", "rejected"}:
        raise ValueError("Status must be either 'approved' or 'rejected'")

    init_gate_db()
    now_iso = _utc_now_iso()
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                UPDATE gates
                SET status = ?, resolved_at = ?
                WHERE id = ? AND status = 'pending'
                """,
                (status, now_iso, gate_id),
            )
            connection.commit()

    return get_gate(gate_id)


def list_gates(
    route_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    init_gate_db()
    safe_limit = max(1, min(limit, 200))
    query = "SELECT * FROM gates"
    params: list[Any] = []
    clauses: list[str] = []

    if route_id:
        clauses.append("route_id = ?")
        params.append(route_id)
    if status:
        clauses.append("status = ?")
        params.append(status)

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY datetime(created_at) DESC LIMIT ?"
    params.append(safe_limit)

    with _DB_LOCK:
        with _get_connection() as connection:
            rows = connection.execute(query, params).fetchall()

    results: list[dict[str, Any]] = []
    for row in rows:
        record = dict(row)
        try:
            record["args"] = json.loads(record.get("args_json", "{}"))
        except Exception:
            record["args"] = {}
        results.append(record)
    return results
