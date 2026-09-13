"""Unit tests for Guardian PolicyEngine, Risk Scoring, and Interactive GateManager."""

import pytest
from services.guardian.policy_engine import ActionRiskLevel, PolicyEngine
from services.guardian.gate_manager import GateManager


@pytest.fixture(autouse=True)
def clean_automation_rules():
    """Ensure clean automation rules before each test."""
    PolicyEngine.clear_automation_rules()
    yield
    PolicyEngine.clear_automation_rules()


def test_low_risk_auto_approved():
    """Verify safe observation and query tools are auto-approved."""
    res = PolicyEngine.evaluate_action(tool="read_file", args={"path": "src/app.py"})
    assert res.risk_level == ActionRiskLevel.LOW
    assert not res.requires_approval
    assert res.auto_approved

    res_search = PolicyEngine.evaluate_action(tool="search_web", args={"query": "FastAPI docs"})
    assert res_search.risk_level == ActionRiskLevel.LOW
    assert not res_search.requires_approval


def test_medium_risk_auto_approved():
    """Verify standard file modifications are medium risk and auto-approved."""
    res = PolicyEngine.evaluate_action(tool="write_to_file", args={"path": "src/app.py", "content": "..."})
    assert res.risk_level == ActionRiskLevel.MEDIUM
    assert not res.requires_approval
    assert res.auto_approved


def test_high_risk_shell_execution_requires_approval():
    """Verify arbitrary shell execution requires human approval by default."""
    res = PolicyEngine.evaluate_action(tool="run_command", args={"command": "npm install"})
    assert res.risk_level == ActionRiskLevel.HIGH
    assert res.requires_approval
    assert not res.auto_approved


def test_critical_destructive_commands_detected():
    """Verify destructive commands (rm -rf, git reset --hard) trigger critical risk."""
    res = PolicyEngine.evaluate_action(tool="run_command", args={"command": "rm -rf /var/data"})
    assert res.risk_level == ActionRiskLevel.CRITICAL
    assert res.requires_approval
    assert "Critical destructive shell command" in res.reason

    res_git = PolicyEngine.evaluate_action(tool="run_command", args={"command": "git reset --hard HEAD~1"})
    assert res_git.risk_level == ActionRiskLevel.CRITICAL
    assert res_git.requires_approval


def test_automation_permission_flow():
    """Verify: asks for permission until said to do for automation."""
    ws = "ws-prod-1"
    tool = "git_push"

    # 1. Initial attempt: requires approval
    res1 = PolicyEngine.evaluate_action(tool=tool, args={"branch": "main"}, workspace_id=ws)
    assert res1.requires_approval
    assert not res1.auto_approved

    # 2. User grants permission for future automation
    PolicyEngine.set_automation_permission(workspace_id=ws, rule_key=tool, allowed=True)

    # 3. Next attempt in same workspace: auto-approved
    res2 = PolicyEngine.evaluate_action(tool=tool, args={"branch": "main"}, workspace_id=ws)
    assert not res2.requires_approval
    assert res2.auto_approved
    assert res2.automation_rule_matched == tool

    # 4. Another workspace still requires approval
    res_other = PolicyEngine.evaluate_action(tool=tool, args={"branch": "main"}, workspace_id="ws-dev-2")
    assert res_other.requires_approval


def test_gate_manager_lifecycle_and_auto_learn():
    """Verify GateManager intercepting, creating gate, and learning automation upon approval."""
    mgr = GateManager()
    ws = "ws-interactive-test"

    # Intercept a high-risk tool
    intercept = mgr.evaluate_and_intercept(
        route_id="route-gm-1",
        step_num=1,
        tool="deploy_service",
        args={"env": "staging"},
        workspace_id=ws,
        action_summary="Deploying to staging",
    )
    assert intercept["status"] == "pending"
    assert "gate_id" in intercept
    gate_id = intercept["gate_id"]

    # Verify gate is pending
    pending_gates = mgr.list_pending_gates(route_id="route-gm-1")
    assert any(g["gate_id"] == gate_id for g in pending_gates)

    # Resolve gate with allow_future_automation = True
    resolved = mgr.resolve_gate(
        gate_id=gate_id,
        approved=True,
        allow_future_automation=True,
        workspace_id=ws,
    )
    assert resolved is not None
    assert resolved["status"] == "approved"

    # Now the same tool in the same workspace should be auto-approved
    intercept_next = mgr.evaluate_and_intercept(
        route_id="route-gm-2",
        step_num=1,
        tool="deploy_service",
        args={"env": "staging"},
        workspace_id=ws,
    )
    assert intercept_next["status"] == "approved"
    assert intercept_next["auto_approved"]
