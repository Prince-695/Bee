"""Tests for Self-Healing Execution Loop in MissionManager integrated with EpisodicMemory."""

import pytest
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.episodic_memory import EpisodicMemoryEngine
from services.orchestrator.dag_engine import DAGNode, TaskStatus
from services.orchestrator.mission_manager import MissionManager


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
async def test_self_healing_callback_on_node_exception(mem_repo: MemoryRepository, setup_db):
    """Verify that when a DAG node fails, the self_heal_fn can recover and complete the node."""
    manager = MissionManager()
    mission = manager.create_mission(
        title="Payment API Migration",
        prompt="Migrate Stripe endpoints",
        workspace_id="tenant-heal-test",
    )

    node = DAGNode(
        id="node-payment",
        title="Update Stripe Charge API",
        instruction="Update charge API endpoints",
        assigned_role="developer",
    )
    manager.populate_dag_nodes(mission.mission_id, [node])

    # Failing execution function
    def failing_fn(args):
        raise ConnectionError("Stripe API connection timeout on port 443")

    # Healing function that applies a retry patch
    def heal_fn(exc, args):
        assert isinstance(exc, ConnectionError)
        return {"success": True, "message": "Applied retry with exponential backoff"}

    result = manager.execute_ready_node(
        mission_id=mission.mission_id,
        node_id="node-payment",
        tool="run_test",
        tool_args={"path": "src/payments/test_stripe.py"},
        execute_fn=failing_fn,
        self_heal_fn=heal_fn,
    )

    assert result["status"] == "completed"
    assert result.get("self_healed") is True
    assert node.status == TaskStatus.COMPLETED
    assert "Applied retry" in node.result_summary


@pytest.mark.anyio
async def test_autonomous_self_heal_node_from_episodic_memory(mem_repo: MemoryRepository, setup_db):
    """Verify that a failed DAG node can autonomously recall a verified fix from episodic memory."""
    episodic_mem = EpisodicMemoryEngine(memory_repo=mem_repo)
    tenant_id = "tenant-heal-test"

    # Pre-seed episodic memory with a verified fix
    await episodic_mem.record_verified_fix(
        tenant_id=tenant_id,
        problem_signature="OperationalError: database locked in sqlite3 line 42",
        patch_diff="--- a/db.py\n+++ b/db.py\n-timeout=1\n+timeout=30",
        error_log="sqlite3.OperationalError: database is locked",
        verified_by_worker_id="worker-reviewer",
    )

    manager = MissionManager(episodic_memory=episodic_mem)
    mission = manager.create_mission(
        title="DB Concurrency Test",
        prompt="Test heavy DB read/writes",
        workspace_id=tenant_id,
    )

    node = DAGNode(
        id="node-db-sync",
        title="Execute high-concurrency batch write",
        instruction="Execute high-concurrency batch write to test locks",
        assigned_role="developer",
    )
    manager.populate_dag_nodes(mission.mission_id, [node])

    # Execute node with an error
    def failing_fn(args):
        raise Exception("OperationalError: database locked in sqlite3 line 99")

    fail_res = manager.execute_ready_node(
        mission_id=mission.mission_id,
        node_id="node-db-sync",
        tool="run_test",
        tool_args={"path": "tests/test_concurrency.py"},
        execute_fn=failing_fn,
    )
    assert fail_res["status"] == "failed"
    assert "OperationalError" in fail_res["error"]
    assert node.error == fail_res["error"]

    # Now trigger autonomous self-healing
    heal_res = await manager.self_heal_node(
        mission_id=mission.mission_id,
        node_id="node-db-sync",
        error_signature=fail_res["error"],
        fixer_fn=lambda fix: {"success": True, "message": f"Applied patch {fix['id']}: timeout=30"},
    )

    assert heal_res["status"] == "self_healed"
    assert node.status == TaskStatus.COMPLETED
    assert "timeout=30" in node.result_summary

    # Ensure mission blackboard received the self-healing proposal and result
    bb = mission.blackboard.get_messages()
    healer_msgs = [m for m in bb if m.sender_worker_id == "system-self-healing"]
    assert len(healer_msgs) >= 2
