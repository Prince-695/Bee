"""Bee Database Package."""

from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA


def __getattr__(name: str):
    if name in ("DatabaseEngine", "get_db_engine"):
        from bee_core.db.connection import DatabaseEngine, get_db_engine
        return DatabaseEngine if name == "DatabaseEngine" else get_db_engine
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["DatabaseEngine", "get_db_engine", "POSTGRES_SCHEMA", "SQLITE_SCHEMA"]
