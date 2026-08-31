"""Comprehensive Test Suite for V1 Platform Endpoints (/v1/missions, /v1/memory, /v1/approvals, /v1/usage, /v1/runtimes)."""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_v1_platform_suite():
    user_email = f"lead_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "LeadPassword123!", "full_name": "Tech Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. POST /v1/missions
        create_mission_res = await client.post(
            "/v1/missions",
            json={
                "title": "PR #108: Fix Pytest flaky fixture in auth loop",
                "description": "Fix assertion error in test_oauth_token_refresh",
                "trigger_type": "github_pr",
            },
            headers=headers,
        )
        assert create_mission_res.status_code == 201
        mission_data = create_mission_res.json()
        assert mission_data["status"] == "created"
        assert mission_data["stage"] == "scout"
        mission_id = mission_data["mission_id"]

        # 3. GET /v1/missions
        list_missions_res = await client.get("/v1/missions", headers=headers)
        assert list_missions_res.status_code == 200
        assert list_missions_res.json()["count"] >= 1

        # 4. GET /v1/missions/:id
        get_mission_res = await client.get(f"/v1/missions/{mission_id}", headers=headers)
        assert get_mission_res.status_code == 200
        assert "Fix Pytest flaky fixture" in get_mission_res.json()["objective"]

        # 5. POST /v1/memory/remediations & recall
        save_mem_res = await client.post(
            "/v1/memory/remediations",
            json={
                "problem_signature": "AssertionError: OAuth token refresh expired",
                "patch_diff": "--- a/token.py\n+++ b/token.py\n@@ -1 +1 @@\n-def refresh(): pass\n+def refresh(): return True",
                "error_log": "AssertionError in tests/test_oauth.py line 42",
                "tags": ["oauth", "token"],
            },
            headers=headers,
        )
        assert save_mem_res.status_code == 201
        assert "id" in save_mem_res.json()

        # Recall remediation
        recall_res = await client.get(
            "/v1/memory/remediations/recall?error_signature=OAuth+token+refresh+expired",
            headers=headers,
        )
        assert recall_res.status_code == 200
        matches = recall_res.json()["matches"]
        assert len(matches) >= 1
        assert "patch_diff" in matches[0]

        # 6. POST /v1/memory/index-chunk & search-code
        index_res = await client.post(
            "/v1/memory/index-chunk",
            json={
                "project_id": "proj_123",
                "file_path": "packages/auth/src/token.py",
                "symbol_name": "refresh_session_token",
                "chunk_content": "def refresh_session_token(token: str) -> bool: return True",
            },
            headers=headers,
        )
        assert index_res.status_code == 201

        search_res = await client.post(
            "/v1/memory/search-code",
            json={"project_id": "proj_123", "query": "refresh session token"},
            headers=headers,
        )
        assert search_res.status_code == 200
        assert len(search_res.json()["results"]) >= 1

        # 7. GET /v1/approvals
        approvals_res = await client.get("/v1/approvals", headers=headers)
        assert approvals_res.status_code == 200

        # 8. GET /v1/usage/spend
        usage_res = await client.get("/v1/usage/spend", headers=headers)
        assert usage_res.status_code == 200
        assert "total_tokens" in usage_res.json()

        # 9. POST /v1/runtimes/register & heartbeat
        runtime_res = await client.post(
            "/v1/runtimes/register",
            json={"machine_name": "MacBook-Pro-M3", "os_name": "darwin"},
            headers=headers,
        )
        assert runtime_res.status_code == 201
        assert runtime_res.json()["status"] == "connected"
        runtime_id = runtime_res.json()["runtime_id"]

        hb_res = await client.post(
            "/v1/runtimes/heartbeat",
            json={"runtime_id": runtime_id, "status": "online"},
            headers=headers,
        )
        assert hb_res.status_code == 200
        assert hb_res.json()["acknowledged"] is True
