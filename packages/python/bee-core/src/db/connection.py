"""Universal Database Connection Manager for Bee Platform.

Delegates to services.data.database for centralized Postgres-first storage.
"""

from __future__ import annotations

from typing import Optional
import services.data.database as _data_db
from services.data.database import DatabaseEngine
from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA

# Global reference for backward compatibility and test fixture overrides
_db_engine: Optional[DatabaseEngine] = None


def get_db_engine() -> DatabaseEngine:
    """Get or create singleton DatabaseEngine, respecting test fixture overrides."""
    global _db_engine
    if _db_engine is not None:
        return _db_engine
    if _data_db._global_db_engine is not None:
        return _data_db._global_db_engine
    return _data_db.get_db_engine()


__all__ = [
    "DatabaseEngine",
    "get_db_engine",
    "_db_engine",
    "POSTGRES_SCHEMA",
    "SQLITE_SCHEMA",
]
