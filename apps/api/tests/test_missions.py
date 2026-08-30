"""Unit tests for Multi-Worker Mission lifecycle and orchestrator."""

import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_core.mission.mission_models import Finding, Mission, MissionStage
from bee_core.mission.mission_store import MissionStore
from bee_core.workers.worker_roles import WorkerRole, get_worker_profile


def test_worker_profiles():
    inspector = get_worker_profile(WorkerRole.INSPECTOR)
    assert inspector.name == "Scout & Inspector Worker"
    assert "code_ripgrep" in inspector.allowed_tools

    fixer = get_worker_profile("fixer")
    assert fixer.name == "Remediation & Auto-Heal Fixer"
    assert "write_file" in fixer.allowed_tools


def test_mission_store_crud(tmp_path):
    db_file = tmp_path / "test_missions.db"
    store = MissionStore(str(db_file))

    # 1. Create Mission
    mission = Mission(
        objective="Inspect PR #42 and auto-heal failing auth assertions",
        signal_id="sig_test_123",
        status="created",
        stage=MissionStage.SCOUT,
    )
    created = store.create_mission(mission)
    assert created["mission_id"] == mission.mission_id
    assert created["objective"] == mission.objective

    # 2. Add Finding
    finding = Finding(
        title="Missing Bearer Header Token",
        severity="high",
        file_path="src/auth.ts",
        line_number=42,
        description="Throws 401 when header is omitted.",
    )
    assert store.add_finding(mission.mission_id, finding) is True

    # 3. Update Stage
    assert store.update_mission_stage(mission.mission_id, MissionStage.REMEDIATION, "fixer", status="in_progress") is True

    # 4. Save Artifact
    assert store.save_artifact(mission.mission_id, "summary", {"repaired": True}) is True

    # 5. Get Mission
    retrieved = store.get_mission(mission.mission_id)
    assert retrieved is not None
    assert retrieved["stage"] == "remediation"
    assert len(retrieved["findings"]) == 1
    assert retrieved["findings"][0]["title"] == "Missing Bearer Header Token"
    assert retrieved["artifacts"]["summary"]["repaired"] is True


def test_mission_api_endpoints():
    client = TestClient(app)

    # 1. Create Mission via API
    create_resp = client.post(
        "/api/missions",
        json={"objective": "Test Mission via API", "signal_id": "sig_api_001"},
    )
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["success"] is True
    mission_id = created_data["data"]["mission_id"]

    # 2. Get Mission via API
    get_resp = client.get(f"/api/missions/{mission_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["mission_id"] == mission_id

    # 3. List Missions
    list_resp = client.get("/api/missions?limit=10")
    assert list_resp.status_code == 200
    assert list_resp.json()["count"] >= 1
