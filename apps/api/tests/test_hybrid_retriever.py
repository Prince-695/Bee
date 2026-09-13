"""Tests for HybridRetriever blending vector embeddings and keyword matching."""

import pytest
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import Citation, MemoryRecord, MemoryScope, MemoryType
from services.memory.retriever import (
    HybridRetriever,
    compute_embedding,
    compute_keyword_score,
    cosine_similarity,
)


def test_embedding_and_cosine_similarity():
    """Verify vector generation and cosine similarity calculation."""
    v1 = compute_embedding("PostgreSQL database setup")
    v2 = compute_embedding("PostgreSQL database configuration")
    v3 = compute_embedding("Banana smoothie recipe")

    assert len(v1) == 768
    assert len(v2) == 768
    assert len(v3) == 768

    # v1 and v2 should have high semantic similarity
    sim_close = cosine_similarity(v1, v2)
    sim_far = cosine_similarity(v1, v3)

    assert sim_close > sim_far
    assert sim_close > 0.4
    assert sim_far < 0.3


def test_keyword_score():
    """Verify BM25 token overlap and tag bonus."""
    score_exact = compute_keyword_score("fastapi async", "FastAPI supports async endpoints", tags=["fastapi"])
    assert score_exact > 0.8

    score_partial = compute_keyword_score("fastapi deployment", "FastAPI supports async endpoints", tags=["python"])
    assert 0.0 < score_partial < score_exact

    score_none = compute_keyword_score("kubernetes docker", "FastAPI supports async endpoints")
    assert score_none == 0.0


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
async def test_hybrid_search_ranking(mem_repo: MemoryRepository, setup_db):
    """Verify HybridRetriever ranks relevant items on top with citations."""
    retriever = HybridRetriever(memory_repo=mem_repo, alpha=0.6)

    # Ingest test memories
    mem1 = MemoryRecord(
        tenant_id="tenant-search",
        title="Docker Container Isolation",
        content="Docker containers provide process and filesystem sandboxing for agent execution.",
        tags=["docker", "sandbox", "security"],
        scope=MemoryScope.PROJECT,
        citations=[Citation(source_id="task-dock", source_type="task", location="infra/docker")],
    )
    mem2 = MemoryRecord(
        tenant_id="tenant-search",
        title="SQLite Fast Local Storage",
        content="SQLite provides zero-config local storage for desktop app instances.",
        tags=["sqlite", "database"],
        scope=MemoryScope.PROJECT,
    )
    mem3 = MemoryRecord(
        tenant_id="tenant-search",
        title="Agent Security Policies",
        content="Guardian enforces file access restrictions and approval gates for agents.",
        tags=["guardian", "security"],
        scope=MemoryScope.ORGANIZATION,
    )

    await mem_repo.create_memory(mem1)
    await mem_repo.create_memory(mem2)
    await mem_repo.create_memory(mem3)

    # Search for container sandboxing
    results = await retriever.search(
        tenant_id="tenant-search",
        query="container sandboxing for agents",
        top_k=2,
    )

    assert len(results) >= 1
    top_hit = results[0]
    assert top_hit.memory.id == mem1.id
    assert top_hit.citation is not None
    assert top_hit.citation.source_id == "task-dock"
    assert top_hit.score > 0.2
    assert top_hit.vector_score > 0
    assert top_hit.keyword_score > 0
