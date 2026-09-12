"""Tests for Offline-to-Cloud SyncEngine and /v1/sync/* Endpoints."""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine
from bee_core.sync.sync_engine import SyncEngine


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_sync_engine_local_lifecycle():
    engine = get_db_engine()
    sync_engine = SyncEngine(db_path=engine.sqlite_path)

    # 1. Insert an offline mission into local DB
    m_id = f"m_offline_{uuid.uuid4().hex[:8]}"
    await engine.execute(
        """
        INSERT INTO missions (
            mission_id, signal_id, objective, status, stage, active_worker,
            findings_json, artifacts_json, created_at, updated_at
        )
        VALUES (?, NULL, 'Offline Fix Auth Loop', 'completed', 'scout', 'inspector', '[]', '{}', datetime('now'), datetime('now'))
        """,
        (m_id,),
    )

    # 2. Extract pending sync payload
    payload = await sync_engine.get_pending_sync_payload()
    assert any(m["mission_id"] == m_id for m in payload["missions"])

    # 3. Mark mission as synced
    await sync_engine.mark_entities_synced("mission", [m_id])

    # 4. Verify mission is no longer in pending payload
    payload_after = await sync_engine.get_pending_sync_payload()
    assert not any(m["mission_id"] == m_id for m in payload_after["missions"])

    # 5. Downstream pull test: Apply a remote mission
    remote_m_id = f"m_remote_{uuid.uuid4().hex[:8]}"
    counts = await sync_engine.apply_downstream_payload({
        "missions": [{
            "mission_id": remote_m_id,
            "objective": "Remote Mobile PR Review",
            "status": "in_progress",
            "stage": "remediation",
            "active_worker": "fixer",
        }],
        "approvals": [],
    })
    assert counts["missions"] == 1

    # Verify remote mission exists in DB
    rows = await engine.fetch_all("SELECT * FROM missions WHERE mission_id = ?", (remote_m_id,))
    assert len(rows) == 1
    assert rows[0]["objective"] == "Remote Mobile PR Review"


@pytest.mark.anyio
async def test_v1_sync_api_endpoints():
    user_email = f"sync_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup to obtain token and tenant
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "SyncPassword123!", "full_name": "Sync Dev"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check /v1/sync/status
        status_res = await client.get("/v1/sync/status", headers=headers)
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "online"

        # 3. Push offline sync payload
        m_id = f"m_pushed_{uuid.uuid4().hex[:8]}"
        push_payload = {
            "missions": [{
                "mission_id": m_id,
                "objective": "Offline Refactor Database Pool",
                "status": "completed",
                "stage": "scribe_report",
                "active_worker": "scribe",
                "findings_json": "[]",
                "artifacts_json": "{}",
            }],
            "approvals": [],
        }

        push_res = await client.post("/v1/sync/push", json=push_payload, headers=headers)
        assert push_res.status_code == 200
        data = push_res.json()
        assert data["success"] is True
        assert data["synced_counts"]["missions"] == 1
        assert m_id in data["synced_mission_ids"]

        # 4. Pull changes from cloud
        pull_res = await client.get("/v1/sync/pull", headers=headers)
        assert pull_res.status_code == 200
        pull_data = pull_res.json()
        assert any(m["mission_id"] == m_id for m in pull_data["missions"])
