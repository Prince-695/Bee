"""Worker Repository for persisting unified worker definitions in Bee Platform."""

from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from bee_core.config import DB_PATH
from services.data.repository import BaseRepository

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


def init_worker_db() -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS workers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    description TEXT,
                    avatar TEXT DEFAULT 'Bot',
                    persona_prompt TEXT,
                    capabilities_json TEXT DEFAULT '[]',
                    allowed_tools_json TEXT DEFAULT '[]',
                    model TEXT DEFAULT 'gemini-3.5-flash',
                    temperature REAL DEFAULT 0.7,
                    is_system INTEGER DEFAULT 0,
                    can_delete INTEGER DEFAULT 1,
                    workspace_id TEXT DEFAULT 'default',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.commit()


class WorkerRepository(BaseRepository):
    """Database repository for Worker definitions."""

    def __init__(self, db: Optional[Any] = None) -> None:
        super().__init__(db)
        self.init_db()

    def init_db(self) -> None:
        init_worker_db()

    def save_worker(self, worker_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates or replaces a worker definition in the database."""
        now_iso = _utc_now_iso()
        created_at = worker_data.get("created_at") or now_iso
        updated_at = now_iso

        cap_json = json.dumps(worker_data.get("capabilities") or [])
        tools_json = json.dumps(worker_data.get("allowed_tools") or [])

        with _DB_LOCK:
            with _get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO workers (
                        id, name, role, description, avatar, persona_prompt,
                        capabilities_json, allowed_tools_json, model, temperature,
                        is_system, can_delete, workspace_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        role = excluded.role,
                        description = excluded.description,
                        avatar = excluded.avatar,
                        persona_prompt = excluded.persona_prompt,
                        capabilities_json = excluded.capabilities_json,
                        allowed_tools_json = excluded.allowed_tools_json,
                        model = excluded.model,
                        temperature = excluded.temperature,
                        is_system = excluded.is_system,
                        can_delete = excluded.can_delete,
                        workspace_id = excluded.workspace_id,
                        updated_at = excluded.updated_at
                    """,
                    (
                        worker_data["id"],
                        worker_data["name"],
                        worker_data.get("role", "worker"),
                        worker_data.get("description", ""),
                        worker_data.get("avatar", "Bot"),
                        worker_data.get("persona_prompt", ""),
                        cap_json,
                        tools_json,
                        worker_data.get("model", "gemini-3.5-flash"),
                        float(worker_data.get("temperature", 0.7)),
                        1 if worker_data.get("is_system") else 0,
                        1 if worker_data.get("can_delete", True) else 0,
                        worker_data.get("workspace_id", "default"),
                        created_at,
                        updated_at,
                    ),
                )
                conn.commit()

        return self.get_worker(worker_data["id"], worker_data.get("workspace_id", "default")) or worker_data

    def get_worker(self, worker_id: str, workspace_id: str = "default") -> Optional[Dict[str, Any]]:
        with _DB_LOCK:
            with _get_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM workers WHERE id = ? AND (workspace_id = ? OR workspace_id = 'default' OR is_system = 1)",
                    (worker_id, workspace_id),
                ).fetchone()

        if not row:
            return None

        return self._row_to_dict(row)

    def list_workers(self, workspace_id: str = "default", role: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM workers WHERE (workspace_id = ? OR workspace_id = 'default' OR is_system = 1)"
        params: List[Any] = [workspace_id]

        if role:
            query += " AND role = ?"
            params.append(role)

        query += " ORDER BY is_system DESC, name ASC"

        with _DB_LOCK:
            with _get_connection() as conn:
                rows = conn.execute(query, params).fetchall()

        return [self._row_to_dict(r) for r in rows]

    def delete_worker(self, worker_id: str, workspace_id: str = "default") -> bool:
        with _DB_LOCK:
            with _get_connection() as conn:
                cursor = conn.execute(
                    "DELETE FROM workers WHERE id = ? AND workspace_id = ? AND can_delete = 1",
                    (worker_id, workspace_id),
                )
                conn.commit()
                return cursor.rowcount > 0

    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
        data = dict(row)
        try:
            data["capabilities"] = json.loads(data.get("capabilities_json", "[]"))
        except Exception:
            data["capabilities"] = []
        try:
            data["allowed_tools"] = json.loads(data.get("allowed_tools_json", "[]"))
        except Exception:
            data["allowed_tools"] = []

        data["is_system"] = bool(data.get("is_system", 0))
        data["can_delete"] = bool(data.get("can_delete", 1))
        return data


__all__ = ["WorkerRepository", "init_worker_db"]
