"""Tests for ContextEngine: multi-source context synthesis and morning executive briefing."""

import pytest
from services.agent_runtime.browser_worker import BrowserHistoryEntry
from services.data.repositories.gate_repo import GateRepository
from services.data.repositories.memory_repo import MemoryRepository
from services.data.repositories.mission_repo import MissionRepository
from services.memory.context_engine import ContextEngine
from services.memory.models import EpisodicRemediation, MemoryRecord, MemoryScope


@pytest.fixture
def mem_repo():
    from bee_core.db.connection import get_db_engine
    return MemoryRepository(db=get_db_engine())


@pytest.fixture
def mission_repo():
    from bee_core.db.connection import get_db_engine
    return MissionRepository(db=get_db_engine())


@pytest.fixture
def gate_repo():
    from bee_core.db.connection import get_db_engine
    repo = GateRepository(db=get_db_engine())
    repo.init_db()
    return repo


@pytest.fixture
async def setup_db():
    from bee_core.db.connection import get_db_engine
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_context_engine_synthesis(
    mem_repo: MemoryRepository,
    mission_repo: MissionRepository,
    gate_repo: GateRepository,
    setup_db,
):
    """Verify ContextEngine synthesizes missions, gates, memories, and morning briefing."""
    tenant_id = "tenant-context-synth"
    engine = ContextEngine(memory_repo=mem_repo, mission_repo=mission_repo, gate_repo=gate_repo)

    # 1. Add a memory
    mem = MemoryRecord(
        tenant_id=tenant_id,
        title="PostgreSQL pgvector Migration",
        content="Migrated embeddings to vector(768) extension.",
        scope=MemoryScope.PROJECT,
    )
    await mem_repo.create_memory(mem)

    # 2. Add a remediation
    rem = EpisodicRemediation(
        tenant_id=tenant_id,
        problem_signature="AuthTokenExpiredError",
        patch_diff="--- a/auth.py\n+++ b/auth.py",
        verified_by_worker_id="worker-dev",
    )
    await mem_repo.save_remediation(rem)

    # 3. Add a pending gate
    gate_repo.create_gate(
        route_id="route-test",
        step_num=1,
        server="terminal",
        tool="deploy_prod",
        args={"target": "prod"},
        action_summary="Deploy production build",
    )

    # 4. Synthesize context
    result = await engine.synthesize_workspace_context(
        tenant_id=tenant_id,
        user_id="user-lead",
        git_summary="On branch feat/memory: 2 files changed, 48 insertions(+)",
        browser_history=[
            BrowserHistoryEntry(
                url="https://github.com/org/repo/pull/42",
                title="PR #42: Vector Search",
                account_id="gh-prince",
            ),
        ],
        browser_permission_granted=True,
        signed_in_account="gh-prince",
    )

    assert result.workspace_id == tenant_id
    assert result.user_id == "user-lead"
    assert len(result.pending_approvals) >= 1
    assert len(result.recent_memories) >= 1
    assert len(result.recent_remediations) >= 1
    assert result.morning_briefing is not None

    briefing = result.morning_briefing
    assert briefing.pending_approvals_count >= 1
    assert "PR #42: Vector Search" in briefing.browser_research_summary
    assert any("AuthTokenExpiredError" in step for step in briefing.recommended_next_steps)
