"""Tests for MemoryRepository CRUD, Context Graph Links, and Remediations."""

import pytest
from services.data.database import DatabaseEngine
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import (
    Citation,
    EpisodicRemediation,
    LinkRelation,
    MemoryLink,
    MemoryRecord,
    MemoryScope,
    MemoryType,
)


@pytest.fixture
def mem_repo():
    """Repository using global test db engine."""
    from bee_core.db.connection import get_db_engine
    return MemoryRepository(db=get_db_engine())


@pytest.fixture(autouse=True)
async def setup_db():
    from bee_core.db.connection import get_db_engine
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_memory_repo_crud(mem_repo: MemoryRepository):
    """Test full CRUD lifecycle of memories."""
    # 1. Create
    mem = MemoryRecord(
        tenant_id="tenant-1",
        user_id="user-1",
        project_id="proj-1",
        worker_id="worker-dev",
        type=MemoryType.SEMANTIC,
        scope=MemoryScope.PROJECT,
        title="Architecture Guideline",
        content="Use FastAPI dependency injection",
        tags=["fastapi", "arch"],
        citations=[Citation(source_id="task-101", source_type="task")],
    )
    created = await mem_repo.create_memory(mem)
    assert created.id == mem.id

    # 2. Get
    retrieved = await mem_repo.get_memory(mem.id, "tenant-1")
    assert retrieved is not None
    assert retrieved.title == "Architecture Guideline"
    assert retrieved.content == "Use FastAPI dependency injection"
    assert retrieved.tags == ["fastapi", "arch"]
    assert len(retrieved.citations) == 1

    # 3. Update
    updated = await mem_repo.update_memory(
        mem.id,
        "tenant-1",
        {"title": "Updated Architecture Guideline", "confidence": 0.95},
    )
    assert updated is not None
    assert updated.title == "Updated Architecture Guideline"
    assert updated.confidence == 0.95

    # 4. List
    records = await mem_repo.list_memories("tenant-1", project_id="proj-1")
    assert len(records) == 1

    # 5. Delete (Forget)
    deleted = await mem_repo.delete_memory(mem.id, "tenant-1")
    assert deleted is True
    assert await mem_repo.get_memory(mem.id, "tenant-1") is None


@pytest.mark.anyio
async def test_context_graph_links(mem_repo: MemoryRepository):
    """Test Context Graph edge creation and retrieval."""
    link = MemoryLink(
        tenant_id="tenant-1",
        source_id="worker-dev",
        source_type="worker",
        target_id="artifact-99",
        target_type="artifact",
        relation=LinkRelation.PRODUCED,
        weight=1.5,
    )
    await mem_repo.create_link(link)

    links_out = await mem_repo.get_links_for_node("worker-dev", "tenant-1", direction="out")
    assert len(links_out) == 1
    assert links_out[0].target_id == "artifact-99"
    assert links_out[0].relation == LinkRelation.PRODUCED

    links_in = await mem_repo.get_links_for_node("artifact-99", "tenant-1", direction="in")
    assert len(links_in) == 1
    assert links_in[0].source_id == "worker-dev"

    # Delete link
    deleted = await mem_repo.delete_link(link.id, "tenant-1")
    assert deleted is True
    assert len(await mem_repo.get_links_for_node("worker-dev", "tenant-1")) == 0


@pytest.mark.anyio
async def test_remediations_catalog(mem_repo: MemoryRepository):
    """Test saving and recalling remediations."""
    rem = EpisodicRemediation(
        tenant_id="tenant-1",
        problem_signature="RuntimeError: Connection timed out",
        error_log="Connection timeout on redis:6379",
        patch_diff="--- a/conn.py\n+++ b/conn.py\n-timeout=1\n+timeout=5",
        verified_by_worker_id="worker-tester",
        tags=["redis", "network"],
    )
    await mem_repo.save_remediation(rem)

    recalled = await mem_repo.get_remediation(rem.id, "tenant-1")
    assert recalled is not None
    assert recalled.problem_signature == "RuntimeError: Connection timed out"
    assert recalled.success_count == 1

    # Increment success
    await mem_repo.increment_remediation_success(rem.id, "tenant-1")
    updated = await mem_repo.get_remediation(rem.id, "tenant-1")
    assert updated.success_count == 2
