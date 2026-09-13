"""Tests for Phase 2 Memory Data Models and Schema definitions."""

import pytest
from services.memory.models import (
    Citation,
    EpisodicRemediation,
    LinkRelation,
    MemoryLink,
    MemoryRecord,
    MemoryScope,
    MemoryType,
    ScoredMemory,
)
from bee_core.db.schema import POSTGRES_SCHEMA, SQLITE_SCHEMA


def test_memory_models_instantiation():
    """Verify all 3 memory tiers and context links can be created and serialized."""
    citation = Citation(
        source_id="mission-123",
        source_type="mission",
        location="src/auth.py:42",
        snippet="token_refresh() implementation",
    )

    mem = MemoryRecord(
        tenant_id="tenant-alpha",
        user_id="user-1",
        project_id="proj-1",
        worker_id="worker-dev",
        type=MemoryType.SEMANTIC,
        scope=MemoryScope.PROJECT,
        title="Coding Guideline",
        content="Always use Pydantic models for data validation",
        tags=["python", "standards"],
        citations=[citation],
    )
    assert mem.id.startswith("mem-")
    assert mem.type == MemoryType.SEMANTIC
    assert mem.scope == MemoryScope.PROJECT
    assert len(mem.citations) == 1
    assert mem.citations[0].source_id == "mission-123"

    # Context Graph Link
    link = MemoryLink(
        tenant_id="tenant-alpha",
        source_id=mem.id,
        source_type="memory",
        target_id="proj-1",
        target_type="project",
        relation=LinkRelation.BELONGS_TO,
    )
    assert link.id.startswith("link-")
    assert link.relation == LinkRelation.BELONGS_TO

    # Remediation
    rem = EpisodicRemediation(
        tenant_id="tenant-alpha",
        problem_signature="AssertionError: Token expired",
        patch_diff="--- a/auth.py\n+++ b/auth.py\n@@ -1 +1 @@\n-expired()\n+refresh()",
        verified_by_worker_id="worker-reviewer",
    )
    assert rem.id.startswith("rem-")
    assert rem.success_count == 1

    # Scored Memory
    scored = ScoredMemory(
        memory=mem,
        score=0.92,
        vector_score=0.95,
        keyword_score=0.88,
        citation=citation,
    )
    assert scored.score == 0.92


def test_schemas_contain_phase2_tables():
    """Verify POSTGRES_SCHEMA and SQLITE_SCHEMA define memories, memory_links, and remediations."""
    for schema in [POSTGRES_SCHEMA, SQLITE_SCHEMA]:
        assert "CREATE TABLE IF NOT EXISTS memories" in schema
        assert "CREATE TABLE IF NOT EXISTS memory_links" in schema
        assert "CREATE TABLE IF NOT EXISTS remediations" in schema
