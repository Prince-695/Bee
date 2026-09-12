"""Universal Database Connection Manager for Bee Platform.

Delegates to services.data.database for centralized Postgres-first storage.
"""

from __future__ import annotations

from services.data.database import (
    DatabaseEngine,
    get_db_engine,
)
from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA

__all__ = [
    "DatabaseEngine",
    "get_db_engine",
    "POSTGRES_SCHEMA",
    "SQLITE_SCHEMA",
]
