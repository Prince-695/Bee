"""Test Suite for Curated MCP Integrations & Worker Tool Provisioning (/v1/mcp/integrations & /v1/mcp/workers)."""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine
from services.data.repositories.worker_repo import WorkerRepository


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_curated_integrations_connect_and_disconnect():
    user_email = f"intg_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "IntgPassword123!", "full_name": "Integration Admin"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List curated integrations
        list_res = await client.get("/v1/mcp/integrations", headers=headers)
        assert list_res.status_code == 200
        intgs = list_res.json()["integrations"]
        assert len(intgs) >= 10
        intg_ids = [i["id"] for i in intgs]
        assert "github" in intg_ids
        assert "slack" in intg_ids
        assert "postgres" in intg_ids
        assert "docker" in intg_ids

        # Docker doesn't require credentials, should be connected by default
        docker_intg = next(i for i in intgs if i["id"] == "docker")
        assert docker_intg["is_connected"] is True

        # Slack requires credentials, not connected yet
        slack_intg = next(i for i in intgs if i["id"] == "slack")
        assert slack_intg["is_connected"] is False

        # 2. Connect Slack integration via vault
        raw_slack_token = "xoxb-testing-mcp-slack-bot-token-12345"
        connect_res = await client.post(
            "/v1/mcp/integrations/slack/connect",
            json={
                "credential_key": "BOT_TOKEN",
                "credential_value": raw_slack_token,
                "label": "Engineering Alerts Slack Bot",
            },
            headers=headers,
        )
        assert connect_res.status_code == 200
        conn_data = connect_res.json()
        assert conn_data["id"] == "slack"
        assert conn_data["is_connected"] is True
        assert conn_data["masked_credential_preview"] == "xoxb...2345"
        assert raw_slack_token not in str(conn_data)  # Plaintext never leaked

        # 3. Verify in integrations list that Slack is now connected
        list_res2 = await client.get("/v1/mcp/integrations", headers=headers)
        slack_updated = next(i for i in list_res2.json()["integrations"] if i["id"] == "slack")
        assert slack_updated["is_connected"] is True
        assert slack_updated["masked_credential_preview"] == "xoxb...2345"

        # 4. Disconnect Slack integration
        disc_res = await client.post("/v1/mcp/integrations/slack/disconnect", headers=headers)
        assert disc_res.status_code == 200
        assert disc_res.json()["success"] is True

        # 5. Verify Slack is no longer connected
        list_res3 = await client.get("/v1/mcp/integrations", headers=headers)
        slack_disc = next(i for i in list_res3.json()["integrations"] if i["id"] == "slack")
        assert slack_disc["is_connected"] is False


@pytest.mark.anyio
async def test_worker_tool_provisioning():
    user_email = f"prov_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "ProvPassword123!", "full_name": "Provisioning Admin"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test worker in database
        repo = WorkerRepository()
        test_worker_id = f"worker_{uuid.uuid4().hex[:8]}"
        repo.save_worker(
            {
                "id": test_worker_id,
                "name": "Custom Flight Tester",
                "role": "tester",
                "allowed_tools": ["ripgrep_search"],
            }
        )

        # 1. Fetch current worker tools
        tools_res = await client.get(f"/v1/mcp/workers/{test_worker_id}/tools", headers=headers)
        assert tools_res.status_code == 200
        t_data = tools_res.json()
        assert t_data["worker_id"] == test_worker_id
        assert t_data["allowed_tools"] == ["ripgrep_search"]
        assert len(t_data["available_catalog_tools"]) >= 10

        # 2. Provision new tools to worker
        new_tools = ["ripgrep_search", "run_shell_command", "github_create_pr", "search_web"]
        prov_res = await client.post(
            f"/v1/mcp/workers/{test_worker_id}/provision",
            json={"allowed_tools": new_tools},
            headers=headers,
        )
        assert prov_res.status_code == 200
        p_data = prov_res.json()
        assert p_data["worker_id"] == test_worker_id
        assert set(p_data["allowed_tools"]) == set(new_tools)

        # 3. Verify updated worker from database
        updated_worker = repo.get_worker(test_worker_id)
        assert updated_worker is not None
        assert set(updated_worker["allowed_tools"]) == set(new_tools)
