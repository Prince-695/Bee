"""Unit tests for DeliberationEngine, Shared Blackboard, and Human-Like Team Collaboration."""

import pytest
from services.agent_runtime.collaboration import (
    DeliberationEngine,
    MessageType,
    MissionBlackboard,
)


def test_plan_and_debate_workflow():
    """Verify Coordinator proposes, Reviewer critiques, and Coordinator refines plan."""
    board = MissionBlackboard(mission_id="mission-collab-1")
    engine = DeliberationEngine(board)

    initial_plan = "Create REST API with FastAPI and SQLite"

    def reviewer_critique(plan: str) -> str:
        return "Critique: We must use Postgres-first architecture, not SQLite directly, and add JWT auth."

    def coordinator_refine(old_plan: str, critique: str) -> str:
        return f"Refined Plan: {old_plan} -> Updated to Postgres-first with async connection pooling and JWT auth."

    approved = engine.run_plan_debate(
        coordinator_plan=initial_plan,
        critique_fn=reviewer_critique,
        refinement_fn=coordinator_refine,
    )

    assert "Postgres-first" in approved
    assert board.get_artifact("approved_plan") == approved

    # Verify messages on blackboard
    messages = board.messages
    assert len(messages) == 3
    assert messages[0].message_type == MessageType.PROPOSAL
    assert messages[1].message_type == MessageType.DEBATE
    assert messages[2].message_type == MessageType.REFINEMENT


def test_execute_test_modify_loop_success_on_retry():
    """Verify Developer executes, Reviewer tests and rejects, Developer modifies, Reviewer approves."""
    board = MissionBlackboard(mission_id="mission-collab-2")
    engine = DeliberationEngine(board)

    def developer_work(iteration: int, critique: str | None) -> dict:
        if iteration == 1:
            return {"code": "def add(a, b): return a - b", "artifacts": ["calc.py"]}
        else:
            # Fixed implementation on iteration 2 based on critique
            return {"code": "def add(a, b): return a + b", "artifacts": ["calc.py"]}

    def reviewer_verify(result: dict) -> dict:
        code = result.get("code", "")
        if "return a - b" in code:
            return {"passed": False, "feedback": "Unit test failed: add(2, 3) returned -1 instead of 5"}
        return {"passed": True, "feedback": "All 10 unit tests passed successfully"}

    outcome = engine.run_execute_test_modify_loop(
        task_title="Implement Calculator Add",
        execute_fn=developer_work,
        verify_fn=reviewer_verify,
        max_iterations=3,
    )

    assert outcome["passed"] is True
    assert outcome["iterations"] == 2

    # Verify blackboard recorded the failure, modification request, and passing report
    mod_requests = board.get_messages(message_type=MessageType.MODIFICATION_REQUEST)
    assert len(mod_requests) == 1
    assert "add(2, 3) returned -1" in mod_requests[0].content

    pass_reports = board.get_messages(message_type=MessageType.VERIFICATION_REPORT)
    assert len(pass_reports) == 1
    assert "All 10 unit tests passed" in pass_reports[0].content


def test_manager_sign_off():
    """Verify Manager reviews and signs off on completed mission."""
    board = MissionBlackboard(mission_id="mission-collab-3")
    engine = DeliberationEngine(board)

    signoff_msg = engine.sign_off_mission(
        manager_id="worker-system-manager",
        summary="All milestones delivered, audited, and verified against specs.",
    )

    assert signoff_msg.message_type == MessageType.MANAGER_SIGN_OFF
    assert board.current_stage == "completed"
    assert "All milestones delivered" in signoff_msg.content
