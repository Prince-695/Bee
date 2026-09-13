"""Tests for SemanticMemoryEngine fact deduplication, conflict resolution, and prompt context formatting."""

import pytest
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import Citation, MemoryScope
from services.memory.semantic_memory import SemanticMemoryEngine


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
async def test_semantic_fact_deduplication_and_update(mem_repo: MemoryRepository, setup_db):
    """Verify that updating a fact with new information updates the existing memory instead of creating duplicates."""
    engine = SemanticMemoryEngine(memory_repo=mem_repo)

    # 1. Initial fact
    fact1 = await engine.store_fact(
        tenant_id="tenant-sem",
        title="Default Test Runner",
        content="The project uses unittest for test execution.",
        scope=MemoryScope.PROJECT,
        project_id="proj-alpha",
        tags=["tests", "python"],
    )
    assert fact1.id is not None
    assert "unittest" in fact1.content

    # 2. Conflicting/updated fact arrives later
    fact2 = await engine.store_fact(
        tenant_id="tenant-sem",
        title="Default Test Runner",
        content="Migrated to pytest with anyio for async test execution.",
        scope=MemoryScope.PROJECT,
        project_id="proj-alpha",
        tags=["tests", "pytest"],
    )

    # The ID should remain identical (deduplicated update)
    assert fact2.id == fact1.id
    assert "pytest" in fact2.content
    assert "unittest" in fact2.metadata.get("superseded_previous", "")

    # 3. Ensure total facts for proj-alpha is still 1
    facts = await mem_repo.list_memories("tenant-sem", project_id="proj-alpha")
    assert len(facts) == 1


@pytest.mark.anyio
async def test_format_context_for_prompt(mem_repo: MemoryRepository, setup_db):
    """Verify formatting facts into a prompt-ready markdown context block."""
    engine = SemanticMemoryEngine(memory_repo=mem_repo)

    await engine.store_fact(
        tenant_id="tenant-prompt",
        title="Auth Architecture",
        content="OAuth2 tokens must use refresh token rotation with 15min TTL.",
        scope=MemoryScope.PROJECT,
        project_id="proj-beta",
        tags=["auth", "oauth", "security"],
        citations=[Citation(source_id="task-oauth-arch", source_type="task")],
    )

    block = await engine.format_context_for_prompt(
        tenant_id="tenant-prompt",
        query="OAuth token refresh flow",
        project_id="proj-beta",
    )

    assert "Relevant Project & Workspace Conventions" in block
    assert "OAuth2 tokens must use refresh token rotation" in block
    assert "task-oauth-arch" in block
