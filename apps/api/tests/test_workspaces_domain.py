"""Test Suite for Workspaces & Repositories Domain (/v1/workspaces)."""

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
async def test_workspaces_lifecycle():
    user_email = f"ws_dev_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "WorkspacePassword123!", "full_name": "Workspace Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Connect new workspace
        connect_res = await client.post(
            "/v1/workspaces",
            json={
                "name": "Bee Platform Core",
                "repo_url": "https://github.com/org/bee.git",
                "default_branch": "main",
                "local_path": "/home/user/Projects/bee",
                "settings": {"ci_enabled": True, "lint_on_save": True},
            },
            headers=headers,
        )
        assert connect_res.status_code == 201
        ws_data = connect_res.json()
        assert ws_data["name"] == "Bee Platform Core"
        assert ws_data["default_branch"] == "main"
        assert ws_data["settings"]["ci_enabled"] is True
        workspace_id = ws_data["id"]

        # 3. List workspaces
        list_res = await client.get("/v1/workspaces", headers=headers)
        assert list_res.status_code == 200
        assert list_res.json()["count"] >= 1
        assert any(w["id"] == workspace_id for w in list_res.json()["workspaces"])

        # 4. Get workspace details
        get_res = await client.get(f"/v1/workspaces/{workspace_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == workspace_id

        # 5. List branches
        branches_res = await client.get(f"/v1/workspaces/{workspace_id}/branches", headers=headers)
        assert branches_res.status_code == 200
        branches_data = branches_res.json()
        assert branches_data["current_branch"] == "main"
        assert "main" in branches_data["branches"]

        # 6. List architecture components
        comp_res = await client.get(f"/v1/workspaces/{workspace_id}/components", headers=headers)
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert comp_data["count"] >= 3
        comp_names = [c["name"] for c in comp_data["components"]]
        assert "API Gateway" in comp_names

        # 7. Sync workspace state
        sync_res = await client.post(
            f"/v1/workspaces/{workspace_id}/sync",
            json={"branch": "feat/desktop", "commit_sha": "a1b2c3d4e5", "dirty": False},
            headers=headers,
        )
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert sync_data["synced"] is True
        assert sync_data["branch"] == "feat/desktop"

        # 8. Check updated branch
        get_updated = await client.get(f"/v1/workspaces/{workspace_id}", headers=headers)
        assert get_updated.status_code == 200
        assert get_updated.json()["default_branch"] == "feat/desktop"
