"""Pytest configuration and global test fixtures for Bee API."""

import os
import tempfile
import pytest
import bee_core.db.connection as db_conn
from bee_core.db.connection import DatabaseEngine


@pytest.fixture(autouse=True, scope="session")
def configure_test_db():
    """Ensure all test suites run against a fast, isolated local SQLite database."""
    with tempfile.NamedTemporaryFile(suffix="_test.db", delete=False) as tmp:
        test_db_path = tmp.name

    engine = DatabaseEngine(database_url=None, sqlite_path=test_db_path)
    db_conn._db_engine = engine

    yield engine

    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except OSError:
            pass


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Clear sliding-window rate limit store between test cases."""
    from bee_api.middleware import _RATE_LIMIT_STORE
    _RATE_LIMIT_STORE.clear()

