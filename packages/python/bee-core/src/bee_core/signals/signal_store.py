"""SQLite storage for incoming engineering signals and webhook events."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from bee_core.signals.signal_model import EngineeringSignal


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SignalStore:
    def __init__(self, db_path: str = "./bee.db") -> None:
        self.db_path = str(Path(db_path).resolve())
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS engineering_signals (
                    signal_id TEXT PRIMARY KEY,
                    source TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    repository TEXT NOT NULL,
                    branch TEXT,
                    sender TEXT,
                    payload_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    matched_mission_id TEXT,
                    created_at TEXT NOT NULL,
                    processed_at TEXT
                )
                """
            )
            conn.commit()

    def record_signal(self, signal: EngineeringSignal) -> Dict[str, Any]:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO engineering_signals (
                    signal_id, source, event_type, repository, branch, sender, payload_json, status, matched_mission_id, created_at, processed_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    signal.signal_id,
                    signal.source.lower(),
                    signal.event_type.lower(),
                    signal.repository,
                    signal.branch,
                    signal.sender,
                    json.dumps(signal.payload),
                    signal.status,
                    signal.matched_mission_id,
                    signal.created_at,
                    signal.processed_at,
                ),
            )
            conn.commit()
        return self.get_signal(signal.signal_id) or {}

    def get_signal(self, signal_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                """
                SELECT signal_id, source, event_type, repository, branch, sender, payload_json, status, matched_mission_id, created_at, processed_at
                FROM engineering_signals
                WHERE signal_id = ?
                """,
                (signal_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "signal_id": row["signal_id"],
                "source": row["source"],
                "event_type": row["event_type"],
                "repository": row["repository"],
                "branch": row["branch"],
                "sender": row["sender"],
                "payload": json.loads(row["payload_json"] or "{}"),
                "status": row["status"],
                "matched_mission_id": row["matched_mission_id"],
                "created_at": row["created_at"],
                "processed_at": row["processed_at"],
            }

    def list_signals(
        self,
        limit: int = 50,
        source: Optional[str] = None,
        event_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM engineering_signals WHERE 1=1"
        params: List[Any] = []
        if source:
            query += " AND source = ?"
            params.append(source.lower())
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type.lower())
        if status:
            query += " AND status = ?"
            params.append(status.lower())

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        with self._get_connection() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
            return [
                {
                    "signal_id": row["signal_id"],
                    "source": row["source"],
                    "event_type": row["event_type"],
                    "repository": row["repository"],
                    "branch": row["branch"],
                    "sender": row["sender"],
                    "payload": json.loads(row["payload_json"] or "{}"),
                    "status": row["status"],
                    "matched_mission_id": row["matched_mission_id"],
                    "created_at": row["created_at"],
                    "processed_at": row["processed_at"],
                }
                for row in rows
            ]

    def update_signal_status(
        self, signal_id: str, status: str, matched_mission_id: Optional[str] = None
    ) -> bool:
        now = _utc_now_iso()
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE engineering_signals
                SET status = ?, matched_mission_id = COALESCE(?, matched_mission_id), processed_at = ?
                WHERE signal_id = ?
                """,
                (status, matched_mission_id, now, signal_id),
            )
            conn.commit()
            return cursor.rowcount > 0
