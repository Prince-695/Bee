"""Unit tests for Unified MissionManager: Dynamic DAG, Collaborative Debate, and Guardian Security."""

import pytest
from services.orchestrator.dag_engine import DAGNode, TaskStatus
from services.orchestrator.mission_manager import MissionManager


@pytest.fixture
def manager():
    return MissionManager()


def test_create_mission_and_deliberate(manager: MissionManager):
    """Verify creating mission, populating DAG, and running debate loop."""
    mission = manager.create_mission(
        title="Build Auth System",
        prompt="Implement OAuth2 and JWT login",
        workspace_id="ws-auth-test",
    )
    assert mission.status == "planning"
    assert len(mission.blackboard.messages) == 1

    # Populate DAG nodes
    manager.populate_dag_nodes(
        mission.mission_id,
        [
            DAGNode(id="step1", title="Research OAuth", assigned_role="researcher", instruction="Check Google OAuth specs"),
            DAGNode(id="step2", title="Implement JWT", assigned_role="developer", instruction="Code tokens", dependencies=["step1"]),
        ],
    )
    assert len(mission.dag.nodes) == 2

    # Run debate loop
    refined = manager.run_plan_debate(
        mission.mission_id,
        coordinator_plan="Use basic JWT with HS256",
        critique_fn=lambda p: "Critique: Use RS256 with key rotation for enterprise security.",
        refinement_fn=lambda p, c: "Refined Plan: Using RS256 with asymmetric keys and rotation.",
    )
    assert "RS256" in refined
    assert mission.status == "executing"


def test_sensitive_file_blocked_by_guardian_in_mission(manager: MissionManager):
    """Verify Guardian FileGuard blocks task attempting to read .env."""
    mission = manager.create_mission(
        title="Check Secrets",
        prompt="Read environment secrets",
        workspace_id="ws-env-test",
    )
    manager.populate_dag_nodes(
        mission.mission_id,
        [DAGNode(id="bad_node", title="Read Env File", assigned_role="developer", instruction="Read .env")],
    )

    result = manager.execute_ready_node(
        mission_id=mission.mission_id,
        node_id="bad_node",
        tool="read_file",
        tool_args={"path": ".env"},
    )
    assert result["status"] == "blocked_by_guardian"
    assert "Security Violation" in result["error"]
    assert mission.dag.nodes["bad_node"].status == TaskStatus.FAILED


def test_approval_gate_and_resumption_in_mission(manager: MissionManager):
    """Verify high-risk tool triggers gate, pauses mission, and resumes upon approval."""
    mission = manager.create_mission(
        title="Deploy to Cloud",
        prompt="Deploy server to staging",
        workspace_id="ws-deploy-test",
    )
    manager.populate_dag_nodes(
        mission.mission_id,
        [DAGNode(id="deploy_node", title="Deploy", assigned_role="developer", instruction="Run deploy")],
    )

    # High-risk command requires approval
    result = manager.execute_ready_node(
        mission_id=mission.mission_id,
        node_id="deploy_node",
        tool="deploy_service",
        tool_args={"target": "staging"},
    )
    assert result["status"] == "approval_required"
    assert mission.status == "paused"
    gate_id = result["gate_id"]

    # Resolve approval gate
    resolve_res = manager.resolve_mission_gate(
        mission_id=mission.mission_id,
        gate_id=gate_id,
        approved=True,
    )
    assert resolve_res["status"] == "resolved"
    assert mission.status == "executing"
