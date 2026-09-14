"""Test Suite for Hybrid MCP Scope Classification and Dispatcher (/v1/mcp/*)."""

import uuid
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
async def test_mcp_scope_classification_and_filtering():
    user_email = f"scope_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "ScopePassword123!", "full_name": "Scope Engineer"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Check all tools have execution_scope
        cat_res = await client.get("/v1/mcp/catalog", headers=headers)
        assert cat_res.status_code == 200
        tools = cat_res.json()["tools"]
        assert len(tools) >= 15
        for t in tools:
            assert t["execution_scope"] in ("LOCAL", "CLOUD", "HYBRID")

        # 2. Filter LOCAL scope tools (e.g. run_shell_command, git_status, write_file)
        local_res = await client.get("/v1/mcp/catalog?scope=LOCAL", headers=headers)
        assert local_res.status_code == 200
        local_tools = local_res.json()["tools"]
        assert len(local_tools) >= 5
        assert all(t["execution_scope"] == "LOCAL" for t in local_tools)
        assert any(t["name"] == "run_shell_command" for t in local_tools)

        # 3. Filter CLOUD scope tools (e.g. search_web, send_email, slack_post_message)
        cloud_res = await client.get("/v1/mcp/catalog?scope=CLOUD", headers=headers)
        assert cloud_res.status_code == 200
        cloud_tools = cloud_res.json()["tools"]
        assert len(cloud_tools) >= 5
        assert all(t["execution_scope"] == "CLOUD" for t in cloud_tools)
        assert any(t["name"] == "search_web" for t in cloud_tools)

        # 4. Filter HYBRID scope tools (e.g. ripgrep_search, ast_search)
        hybrid_res = await client.get("/v1/mcp/catalog?scope=HYBRID", headers=headers)
        assert hybrid_res.status_code == 200
        hybrid_tools = hybrid_res.json()["tools"]
        assert len(hybrid_tools) >= 3
        assert all(t["execution_scope"] == "HYBRID" for t in hybrid_tools)


@pytest.mark.anyio
async def test_scope_dispatcher_offline_vs_online():
    user_email = f"dispatch_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Signup user and resolve tenant
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "DispatchPassword123!", "full_name": "Dispatch Engineer"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Execute CLOUD tool when NO workstation runtime exists -> should SUCCEED
        cloud_exec = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "duckduckgo",
                "tool_name": "search_web",
                "arguments": {"query": "FastAPI SSE streaming"},
            },
            headers=headers,
        )
        assert cloud_exec.status_code == 200
        c_data = cloud_exec.json()
        assert c_data["success"] is True
        assert c_data["execution_scope"] == "CLOUD"

        # 2. Execute LOCAL tool when NO runtime is online -> should FAIL with runtime_offline
        local_fail_exec = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "sandbox_runner",
                "tool_name": "run_shell_command",
                "arguments": {"command": "ls -la"},
            },
            headers=headers,
        )
        assert local_fail_exec.status_code == 200
        lf_data = local_fail_exec.json()
        assert lf_data["success"] is False
        assert lf_data["result"]["error"] == "runtime_offline"
        assert lf_data["execution_scope"] == "LOCAL"

        # 3. Execute HYBRID tool when NO runtime is online -> should FALLBACK to cloud
        hybrid_fallback = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "code_search",
                "tool_name": "ripgrep_search",
                "arguments": {"query": "test"},
            },
            headers=headers,
        )
        assert hybrid_fallback.status_code == 200
        hf_data = hybrid_fallback.json()
        assert hf_data["success"] is True
        assert hf_data["result"]["mode"] == "cloud_fallback"

        # 4. Now REGISTER an active online workstation runtime
        reg_res = await client.post(
            "/v1/runtimes/register",
            json={
                "machine_name": "MacBook-Air-M2.local",
                "os_name": "darwin",
                "capabilities": ["filesystem", "terminal", "docker", "git"],
            },
            headers=headers,
        )
        assert reg_res.status_code == 201
        runtime_id = reg_res.json()["runtime_id"]

        # 5. Execute LOCAL tool now that runtime is online -> should SUCCEED and route to runtime
        local_succ_exec = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "sandbox_runner",
                "tool_name": "run_shell_command",
                "arguments": {"command": "echo Hello from Workstation"},
            },
            headers=headers,
        )
        assert local_succ_exec.status_code == 200
        ls_data = local_succ_exec.json()
        assert ls_data["success"] is True
        assert ls_data["execution_scope"] == "LOCAL"
        assert ls_data["dispatched_runtime_id"] == runtime_id
        assert ls_data["result"]["dispatched_to_workstation"] == "MacBook-Air-M2.local"

        # 6. Execute HYBRID tool with runtime online -> should route to local workstation
        hybrid_online = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "code_search",
                "tool_name": "ripgrep_search",
                "arguments": {"query": "class DatabaseEngine"},
            },
            headers=headers,
        )
        assert hybrid_online.status_code == 200
        ho_data = hybrid_online.json()
        assert ho_data["success"] is True
        assert ho_data["execution_scope"] == "HYBRID"
        assert ho_data["dispatched_runtime_id"] == runtime_id
