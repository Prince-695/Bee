"""Unified Database Engine for Bee Platform.

Postgres-first architecture supporting Neon Serverless, connection pooling,
and graceful fallback to local SQLite for offline/isolated execution.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
import aiosqlite
from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA

_SENTINEL = object()
_global_db_engine: Optional[DatabaseEngine] = None


class DatabaseEngine:
    """Postgres-first asynchronous Database Engine with connection pooling."""

    def __init__(self, database_url: Any = _SENTINEL, sqlite_path: str = "./bee.db"):
        if database_url is not _SENTINEL:
            self.database_url = database_url if database_url else None
        else:
            self.database_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
        self.sqlite_path = sqlite_path
        self.is_postgres = bool(
            self.database_url and ("postgres" in self.database_url or "postgresql" in self.database_url)
        )
        self._pool = None
        self._initialized = False

    async def get_pool(self):
        """Get or create asyncpg connection pool for PostgreSQL."""
        if not self.is_postgres:
            return None
        if self._pool is None:
            try:
                import asyncpg
                self._pool = await asyncpg.create_pool(
                    self.database_url,
                    min_size=1,
                    max_size=10,
                    timeout=5.0,
                    command_timeout=10.0,
                )
            except Exception:
                self.is_postgres = False
                self._pool = None
        return self._pool

    async def init_db(self) -> None:
        """Initialize database schemas."""
        await self._init_sqlite()
        self._initialized = True
        if self.is_postgres:
            try:
                pool = await self.get_pool()
                if pool:
                    async with pool.acquire() as conn:
                        await conn.execute(POSTGRES_SCHEMA)
            except Exception:
                self.is_postgres = False

    async def _init_sqlite(self) -> None:
        async with aiosqlite.connect(self.sqlite_path) as db:
            await db.execute("PRAGMA foreign_keys = ON;")
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")
            await db.execute("PRAGMA busy_timeout = 5000;")
            await db.executescript(SQLITE_SCHEMA)
            await db.commit()
        try:
            if os.path.exists(self.sqlite_path):
                os.chmod(self.sqlite_path, 0o600)
        except OSError:
            pass

    async def _ensure_initialized(self) -> None:
        if not self._initialized:
            await self._init_sqlite()
            self._initialized = True

    async def execute(self, query: str, parameters: tuple = ()) -> None:
        """Execute a write/mutation query."""
        await self._ensure_initialized()
        if self.is_postgres:
            try:
                pool = await self.get_pool()
                if pool:
                    async with pool.acquire() as conn:
                        pg_query = self._format_postgres_query(query)
                        await conn.execute(pg_query, *parameters)
                    return
            except Exception:
                self.is_postgres = False

        async with aiosqlite.connect(self.sqlite_path) as db:
            await db.execute(query, parameters)
            await db.commit()

    async def fetch_one(self, query: str, parameters: tuple = ()) -> Optional[Dict[str, Any]]:
        """Fetch a single record as a dict."""
        await self._ensure_initialized()
        if self.is_postgres:
            try:
                pool = await self.get_pool()
                if pool:
                    async with pool.acquire() as conn:
                        pg_query = self._format_postgres_query(query)
                        row = await conn.fetchrow(pg_query, *parameters)
                        return dict(row) if row else None
            except Exception:
                self.is_postgres = False

        async with aiosqlite.connect(self.sqlite_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, parameters) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else None

    async def fetch_all(self, query: str, parameters: tuple = ()) -> List[Dict[str, Any]]:
        """Fetch multiple records as a list of dicts."""
        await self._ensure_initialized()
        if self.is_postgres:
            try:
                pool = await self.get_pool()
                if pool:
                    async with pool.acquire() as conn:
                        pg_query = self._format_postgres_query(query)
                        rows = await conn.fetch(pg_query, *parameters)
                        return [dict(r) for r in rows]
            except Exception:
                self.is_postgres = False

        async with aiosqlite.connect(self.sqlite_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, parameters) as cursor:
                rows = await cursor.fetchall()
                return [dict(r) for r in rows]

    async def close(self) -> None:
        """Close connection pools."""
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    @staticmethod
    def _format_postgres_query(query: str) -> str:
        """Convert SQLite '?' placeholders to Postgres '$1, $2, ...' placeholders."""
        parts = query.split("?")
        if len(parts) == 1:
            return query
        formatted = ""
        for i, part in enumerate(parts[:-1]):
            formatted += part + f"${i + 1}"
        formatted += parts[-1]
        return formatted


def get_db_engine() -> DatabaseEngine:
    """Get or create singleton DatabaseEngine."""
    global _global_db_engine
    if _global_db_engine is None:
        _global_db_engine = DatabaseEngine()
    return _global_db_engine
