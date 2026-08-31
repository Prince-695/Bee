"""Universal Database Connection Manager for Bee Platform."""

from __future__ import annotations

import os
import aiosqlite
from typing import Any, Dict, List, Optional
from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA

# Global database manager instance
_db_engine: Optional[DatabaseEngine] = None


class DatabaseEngine:
    def __init__(self, database_url: Optional[str] = None, sqlite_path: str = "./bee.db"):
        self.database_url = database_url or os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
        self.sqlite_path = sqlite_path
        self.is_postgres = bool(self.database_url and ("postgres" in self.database_url or "postgresql" in self.database_url))

    async def init_db(self) -> None:
        """Initialize database schema tables."""
        if self.is_postgres:
            try:
                import asyncpg
                conn = await asyncpg.connect(self.database_url)
                try:
                    await conn.execute(POSTGRES_SCHEMA)
                finally:
                    await conn.close()
            except ImportError:
                # Fallback to local SQLite if asyncpg is not available
                await self._init_sqlite()
        else:
            await self._init_sqlite()

    async def _init_sqlite(self) -> None:
        async with aiosqlite.connect(self.sqlite_path) as db:
            await db.executescript(SQLITE_SCHEMA)
            await db.commit()

    async def execute(self, query: str, parameters: tuple = ()) -> None:
        """Execute a write/mutation query."""
        if self.is_postgres:
            import asyncpg
            conn = await asyncpg.connect(self.database_url)
            try:
                # Replace SQLite ? with Postgres $1, $2
                pg_query = self._format_postgres_query(query)
                await conn.execute(pg_query, *parameters)
            finally:
                await conn.close()
        else:
            async with aiosqlite.connect(self.sqlite_path) as db:
                await db.execute(query, parameters)
                await db.commit()

    async def fetch_one(self, query: str, parameters: tuple = ()) -> Optional[Dict[str, Any]]:
        """Fetch a single record as a dict."""
        if self.is_postgres:
            import asyncpg
            conn = await asyncpg.connect(self.database_url)
            try:
                pg_query = self._format_postgres_query(query)
                row = await conn.fetchrow(pg_query, *parameters)
                return dict(row) if row else None
            finally:
                await conn.close()
        else:
            async with aiosqlite.connect(self.sqlite_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(query, parameters) as cursor:
                    row = await cursor.fetchone()
                    return dict(row) if row else None

    async def fetch_all(self, query: str, parameters: tuple = ()) -> List[Dict[str, Any]]:
        """Fetch multiple records as a list of dicts."""
        if self.is_postgres:
            import asyncpg
            conn = await asyncpg.connect(self.database_url)
            try:
                pg_query = self._format_postgres_query(query)
                rows = await conn.fetch(pg_query, *parameters)
                return [dict(r) for r in rows]
            finally:
                await conn.close()
        else:
            async with aiosqlite.connect(self.sqlite_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(query, parameters) as cursor:
                    rows = await cursor.fetchall()
                    return [dict(r) for r in rows]

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
    global _db_engine
    if _db_engine is None:
        _db_engine = DatabaseEngine()
    return _db_engine
