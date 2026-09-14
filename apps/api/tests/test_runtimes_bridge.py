"""Test Suite for Cloud <-> Workstation Runtime Bridge (/v1/runtimes)."""

import uuid
from datetime import datetime, timedelta, timezone
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine
from services.data.repositories.runtime_repo import RuntimeRepository


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_runtime_pairing_lifecycle_and_heartbeats():
    user_email = f"runtime_tester_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user to get tenant context
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "RuntimePassword123!", "full_name": "Runtime Engineer"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Register new workstation runtime
        reg_payload = {
            "machine_name": "MacBook-Pro-M3.local",
            "os_name": "darwin",
            "capabilities": ["filesystem", "terminal", "docker", "git", "python"],
            "metadata": {"cpu_cores": 16, "ram_gb": 36, "arch": "arm64"},
        }
        reg_res = await client.post("/v1/runtimes/register", json=reg_payload, headers=headers)
        assert reg_res.status_code == 201
        reg_data = reg_res.json()
        runtime_id = reg_data["runtime_id"]
        pairing_key = reg_data["pairing_key"]

        assert runtime_id.startswith("rt_")
        assert pairing_key.startswith("bee_rt_")
        assert reg_data["machine_name"] == "MacBook-Pro-M3.local"
        assert reg_data["status"] == "connected"
        assert "filesystem" in reg_data["capabilities"]

        # 3. List runtimes for tenant
        list_res = await client.get("/v1/runtimes", headers=headers)
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["count"] >= 1
        assert any(r["runtime_id"] == runtime_id for r in list_data["runtimes"])

        # 4. Get runtime status
        status_res = await client.get(f"/v1/runtimes/{runtime_id}/status", headers=headers)
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["runtime_id"] == runtime_id
        assert status_data["is_online"] is True
        assert status_data["status"] == "connected"

        # 5. Heartbeat ping from runtime
        hb_res = await client.post(
            "/v1/runtimes/heartbeat",
            json={"runtime_id": runtime_id, "status": "busy"},
            headers=headers,
        )
        assert hb_res.status_code == 200
        hb_data = hb_res.json()
        assert hb_data["acknowledged"] is True
        assert hb_data["status"] == "busy"

        # 6. Verify status updated to busy
        status_res2 = await client.get(f"/v1/runtimes/{runtime_id}/status", headers=headers)
        assert status_res2.status_code == 200
        assert status_res2.json()["status"] == "busy"

        # 7. Revoke runtime pairing
        del_res = await client.delete(f"/v1/runtimes/{runtime_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True

        # 8. Verify runtime no longer exists
        status_res3 = await client.get(f"/v1/runtimes/{runtime_id}/status", headers=headers)
        assert status_res3.status_code == 404


@pytest.mark.anyio
async def test_runtime_pairing_key_verification_and_staleness():
    repo = RuntimeRepository()
    tenant_id = f"ten_{uuid.uuid4().hex[:8]}"

    # 1. Register via repo
    reg = await repo.register_runtime(
        tenant_id=tenant_id,
        machine_name="ubuntu-ci-runner",
        os_name="linux",
        capabilities=["terminal", "git"],
    )
    pairing_key = reg["pairing_key"]
    runtime_id = reg["runtime_id"]

    # 2. Verify valid pairing key
    verified = await repo.verify_pairing_key(pairing_key)
    assert verified is not None
    assert verified["runtime_id"] == runtime_id
    assert verified["machine_name"] == "ubuntu-ci-runner"

    # 3. Verify invalid key fails
    assert await repo.verify_pairing_key("bee_rt_fake_invalid_key") is None

    # 4. Simulate stale runtime (> 60 seconds ago)
    stale_dt = (datetime.now(timezone.utc) - timedelta(seconds=120)).isoformat()
    await repo.execute(
        "UPDATE paired_runtimes SET last_heartbeat_at = ? WHERE id = ?",
        (stale_dt, runtime_id),
    )

    # 5. Listing triggers auto-stale mark to offline
    runtimes = await repo.list_runtimes(tenant_id=tenant_id, mark_stale_after_sec=60)
    matched = next((r for r in runtimes if r["runtime_id"] == runtime_id), None)
    assert matched is not None
    assert matched["status"] == "offline"
