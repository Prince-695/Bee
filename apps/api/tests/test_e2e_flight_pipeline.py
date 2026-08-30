"""End-to-End Integration Flight and Multi-Worker Mission Pipeline Test Suite.

Simulates the complete production lifecycle:
1. Incoming GitHub PR Webhook ingestion
2. Signal policy matching to autonomous flight
3. Multi-worker mission execution (Inspector -> Tester -> Fixer -> Guard -> Scribe)
4. Zero-leak secret redaction across outputs
5. Token and cost budget tracking
6. WhatsApp approval gate resolution
7. Final verified completion
"""

import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_core.security.secret_redactor import SecretRedactor
from bee_core.security.budget_engine import BudgetEngine
from bee_core.stores.gate_store import create_gate, get_gate, resolve_gate
from bee_core.signals.signal_model import EngineeringSignal
from bee_core.signals.signal_policy import SignalPolicyEngine
from bee_core.mission.mission_models import Mission, MissionStage, Finding
from bee_core.mission.mission_store import MissionStore


def test_full_e2e_autonomous_engineering_lifecycle(tmp_path):
    client = TestClient(app)
    db_file = str(tmp_path / "e2e_test.db")
    mission_store = MissionStore(db_file)
    budget_engine = BudgetEngine(db_file)

    # ─── Step 1: Ingest GitHub PR Webhook ───
    pr_payload = {
        "action": "opened",
        "repository": {"full_name": "Prince-695/bee"},
        "pull_request": {
            "title": "feat: add oauth2 providers",
            "head": {"ref": "feat/oauth"},
            "user": {"login": "developer"},
        },
    }
    wh_resp = client.post("/webhooks/github", json=pr_payload)
    assert wh_resp.status_code == 200
    assert wh_resp.json()["status"] == "received"
    signal_id = wh_resp.json()["signal_id"]

    # ─── Step 2: Policy Evaluation ───
    sig = EngineeringSignal(
        signal_id=signal_id,
        source="github",
        event_type="pr_opened",
        repository="Prince-695/bee",
        branch="feat/oauth",
        sender="developer",
        payload=pr_payload,
    )
    plan = SignalPolicyEngine.evaluate_signal(sig)
    assert plan is not None
    assert plan["policy_name"] == "pr_autonomous_inspection"

    # ─── Step 3: Create Multi-Worker Mission ───
    mission = Mission(
        mission_id=plan["mission_id"],
        signal_id=signal_id,
        objective=plan["objective"],
        status="in_progress",
        stage=MissionStage.SCOUT,
    )
    created = mission_store.create_mission(mission)
    assert created["mission_id"] == mission.mission_id

    # ─── Step 4: Scout & Inspector Phase (AST & Diffs) ───
    finding = Finding(
        title="Unmasked Token in Request Logs",
        severity="high",
        file_path="src/auth.ts",
        line_number=42,
        description="Raw GitHub token ghp_123456789012345678901234567890123456 printed in log output",
    )
    assert mission_store.add_finding(mission.mission_id, finding) is True

    # ─── Step 5: Tester & Fixer Phase (Remediation & Zero-Leak Redactor) ───
    assert mission_store.update_mission_stage(mission.mission_id, MissionStage.REMEDIATION, "fixer") is True
    
    # Redact secret before saving evidence
    raw_log = f"Fixed finding by masking token: {finding.description}"
    redacted_log, detected = SecretRedactor.redact_text(raw_log)
    assert "[REDACTED_GITHUB_TOKEN]" in redacted_log
    assert "GITHUB_TOKEN" in detected

    mission_store.save_artifact(mission.mission_id, "remediation_log", redacted_log)

    # ─── Step 6: Budget & Token Accounting ───
    usage = budget_engine.record_usage(
        model="gemini-2.5-flash",
        prompt_tokens=4200,
        completion_tokens=850,
        route_id=mission.mission_id,
    )
    assert usage.total_tokens == 5050
    assert usage.estimated_cost_usd > 0

    # ─── Step 7: Safety Guard & WhatsApp Human Approval Gate ───
    gate = create_gate(
        route_id=mission.mission_id,
        step_num=4,
        server="git",
        tool="git_push",
        args={"branch": "feat/oauth"},
        action_summary="Push auto-healed security remediation to origin/feat/oauth",
    )
    gate_id = gate["gate_id"]
    assert gate["status"] == "pending"

    # Simulate WhatsApp 1-Click Interactive Approval click
    wa_resp = client.post("/webhooks/whatsapp", json={"button_id": f"APPROVE_{gate_id}"})
    assert wa_resp.status_code == 200
    assert wa_resp.json()["decision"] == "approved"

    resolved_gate = get_gate(gate_id)
    assert resolved_gate["status"] == "approved"

    # ─── Step 8: Scribe Documentation & Final Completion ───
    assert mission_store.update_mission_stage(mission.mission_id, MissionStage.SCRIBE_REPORT, "scribe") is True
    final_report = f"# Scribe Report for {mission.mission_id}\nAll 5 worker stages verified. 0 open defects."
    mission_store.save_artifact(mission.mission_id, "final_report", final_report)
    assert mission_store.update_mission_stage(mission.mission_id, MissionStage.COMPLETED, "scribe", status="completed") is True

    # ─── Verify Final Mission State ───
    final_state = mission_store.get_mission(mission.mission_id)
    assert final_state["status"] == "completed"
    assert len(final_state["findings"]) == 1
    assert "final_report" in final_state["artifacts"]
