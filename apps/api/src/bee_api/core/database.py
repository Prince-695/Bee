"""Enterprise Connection Pooling and Database Manager.

Uses asyncpg.create_pool for high-throughput concurrency with SQLite local fallback.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, List, Optional
import aiosqlite

from bee_api.core.config import settings

logger = logging.getLogger("bee.database")

_pool: Any = None


async def init_db_pool() -> None:
    """Initializes asyncpg connection pool if DATABASE_URL is configured."""
    global _pool
    if not settings.DATABASE_URL:
        logger.info("[DATABASE]: No DATABASE_URL provided. Running with local SQLite.")
        return

    # Only connect if database_url looks like postgres
    if "postgres" not in settings.DATABASE_URL:
        return

    try:
        import asyncpg
        # Convert postgresql+asyncpg:// to postgresql:// if needed for asyncpg driver
        pg_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncpg.create_pool(
            dsn=pg_url,
            min_size=settings.DATABASE_POOL_MIN_SIZE,
            max_size=settings.DATABASE_POOL_MAX_SIZE,
            timeout=10.0,
            command_timeout=30.0,
        )
        logger.info(f"[DATABASE]: Initialized asyncpg connection pool (size: {settings.DATABASE_POOL_MIN_SIZE}-{settings.DATABASE_POOL_MAX_SIZE})")
    except Exception as exc:
        logger.warning(f"[DATABASE]: Failed to initialize asyncpg pool: {exc}. Falling back to SQLite.")
        _pool = None


async def close_db_pool() -> None:
    """Gracefully closes all pool connections on application shutdown."""
    global _pool
    if _pool is not None:
        try:
            await _pool.close()
            logger.info("[DATABASE]: asyncpg connection pool closed successfully.")
        except Exception as exc:
            logger.error(f"[DATABASE]: Error closing pool: {exc}")
        finally:
            _pool = None


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[Any, None]:
    """Borrows a connection from the pool, or falls back to aiosqlite."""
    global _pool
    if _pool is not None:
        async with _pool.acquire() as connection:
            yield connection
    else:
        async with aiosqlite.connect(settings.DB_PATH) as connection:
            connection.row_factory = aiosqlite.Row
            yield connection


async def check_db_health() -> bool:
    """Executes a ping query to verify database liveness."""
    global _pool
    try:
        if _pool is not None:
            async with _pool.acquire() as conn:
                val = await conn.fetchval("SELECT 1")
                return val == 1
        else:
            async with aiosqlite.connect(settings.DB_PATH) as conn:
                cursor = await conn.execute("SELECT 1")
                row = await cursor.fetchone()
                return bool(row and row[0] == 1)
    except Exception as err:
        logger.error(f"[DATABASE_HEALTH]: Health check failed: {err}")
        return False
