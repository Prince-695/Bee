"""Base Repository for Bee Platform Services."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from services.data.database import DatabaseEngine, get_db_engine


class BaseRepository:
    """Base repository class wrapping database operations."""

    def __init__(self, db: Optional[DatabaseEngine] = None):
        self._db = db

    @property
    def db(self) -> DatabaseEngine:
        if self._db is None:
            self._db = get_db_engine()
        return self._db

    async def execute(self, query: str, parameters: tuple = ()) -> None:
        await self.db.execute(query, parameters)

    async def fetch_one(self, query: str, parameters: tuple = ()) -> Optional[Dict[str, Any]]:
        return await self.db.fetch_one(query, parameters)

    async def fetch_all(self, query: str, parameters: tuple = ()) -> List[Dict[str, Any]]:
        return await self.db.fetch_all(query, parameters)
