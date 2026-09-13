"""Tests for EpisodicMemoryEngine: error normalization, execution traces, and self-healing patch recall."""

import pytest
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.episodic_memory import (
    EpisodicMemoryEngine,
    normalize_error_signature,
)
from services.memory.models import MemoryType


def test_normalize_error_signature():
    """Verify error signature normalizer strips volatile variables."""
    raw1 = "AssertionError in /app/tests/test_auth.py line 42: Token expired at 2026-09-13T20:53:50Z at 0x7f99ab4b8d60"
    raw2 = "AssertionError in /app/tests/test_auth.py line 108: Token expired at 2026-09-14T10:11:12Z at 0x7f11cd2e99a0"

    norm1 = normalize_error_signature(raw1)
    norm2 = normalize_error_signature(raw2)

    assert norm1 == norm2
    assert "line <N>" in norm1
    assert "<ADDR>" in norm1
    assert "<TIMESTAMP>" in norm1


@pytest.fixture
def mem_repo():
    from bee_core.db.connection import get_db_engine
    return MemoryRepository(db=get_db_engine())


@pytest.fixture
async def setup_db():
    from bee_core.db.connection import get_db_engine
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_record_execution_trace(mem_repo: MemoryRepository, setup_db):
    """Verify recording an execution trace into episodic memory."""
    engine = EpisodicMemoryEngine(memory_repo=mem_repo)

    trace = await engine.record_execution_trace(
        tenant_id="tenant-trace",
        mission_id="mission-99",
        task_title="Compile TypeScript Packages",
        content="pnpm build completed in 4.2s with 0 errors.",
        worker_id="worker-dev",
        success=True,
        artifacts=["dist/index.js"],
    )

    assert trace.id.startswith("mem-")
    assert trace.type == MemoryType.EPISODIC
    assert "[Success]" in trace.title
    assert trace.metadata["mission_id"] == "mission-99"
    assert "dist/index.js" in trace.metadata["artifacts"]


@pytest.mark.anyio
async def test_record_and_recall_verified_fix(mem_repo: MemoryRepository, setup_db):
    """Verify recording and recalling verified fixes with fuzzy error signatures."""
    engine = EpisodicMemoryEngine(memory_repo=mem_repo)

    # 1. Record verified fix
    fix = await engine.record_verified_fix(
        tenant_id="tenant-fix",
        problem_signature="OperationalError: database locked in sqlite3 line 88 at 0x7f33a",
        patch_diff="--- a/db.py\n+++ b/db.py\n-timeout=1.0\n+timeout=30.0",
        error_log="sqlite3.OperationalError: database is locked",
        verified_by_worker_id="worker-reviewer",
        tags=["sqlite", "timeout"],
    )
    assert fix.id is not None
    assert fix.success_count == 1

    # 2. Recall fix using slightly different line number and address
    query_err = "OperationalError: database locked in sqlite3 line 144 at 0x7f99b"
    matches = await engine.recall_remediations(
        tenant_id="tenant-fix",
        error_signature=query_err,
        top_k=1,
    )

    assert len(matches) == 1
    assert matches[0]["id"] == fix.id
    assert "timeout=30.0" in matches[0]["patch_diff"]
    assert matches[0]["similarity_score"] > 0.5
