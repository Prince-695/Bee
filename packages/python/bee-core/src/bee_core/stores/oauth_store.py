"""SQLite storage for OAuth connector credentials and tokens."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OAuthStore:
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
                CREATE TABLE IF NOT EXISTS user_connectors (
                    user_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT,
                    scopes TEXT,
                    metadata_json TEXT,
                    connected_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, provider)
                )
                """
            )
            conn.commit()

    def store_token(
        self,
        user_id: str,
        provider: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        now = _utc_now_iso()
        scopes_str = json.dumps(scopes or [])
        meta_str = json.dumps(metadata or {})
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO user_connectors (
                    user_id, provider, access_token, refresh_token, scopes, metadata_json, connected_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, provider) DO UPDATE SET
                    access_token = excluded.access_token,
                    refresh_token = COALESCE(excluded.refresh_token, user_connectors.refresh_token),
                    scopes = excluded.scopes,
                    metadata_json = excluded.metadata_json,
                    updated_at = excluded.updated_at
                """,
                (user_id, provider.lower(), access_token, refresh_token, scopes_str, meta_str, now, now),
            )
            conn.commit()
        return self.get_connector(user_id, provider) or {}

    def get_connector(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                """
                SELECT user_id, provider, access_token, refresh_token, scopes, metadata_json, connected_at, updated_at
                FROM user_connectors
                WHERE user_id = ? AND provider = ?
                """,
                (user_id, provider.lower()),
            ).fetchone()
            if not row:
                return None
            return {
                "user_id": row["user_id"],
                "provider": row["provider"],
                "access_token": row["access_token"],
                "refresh_token": row["refresh_token"],
                "scopes": json.loads(row["scopes"] or "[]"),
                "metadata": json.loads(row["metadata_json"] or "{}"),
                "connected_at": row["connected_at"],
                "updated_at": row["updated_at"],
            }

    def list_connectors(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT user_id, provider, scopes, metadata_json, connected_at, updated_at
                FROM user_connectors
                WHERE user_id = ?
                ORDER BY connected_at ASC
                """,
                (user_id,),
            ).fetchall()
            return [
                {
                    "user_id": row["user_id"],
                    "provider": row["provider"],
                    "scopes": json.loads(row["scopes"] or "[]"),
                    "metadata": json.loads(row["metadata_json"] or "{}"),
                    "connected_at": row["connected_at"],
                    "updated_at": row["updated_at"],
                }
                for row in rows
            ]

    def delete_connector(self, user_id: str, provider: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM user_connectors WHERE user_id = ? AND provider = ?",
                (user_id, provider.lower()),
            )
            conn.commit()
            return cursor.rowcount > 0
