"""Test Suite for Global Cloud FastMCP Catalog and Fuzzy Search Engine (/v1/mcp)."""

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
async def test_mcp_catalog_and_search_lifecycle():
    user_email = f"mcp_dev_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "McpPassword123!", "full_name": "MCP Developer"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Browse full catalog
        cat_res = await client.get("/v1/mcp/catalog", headers=headers)
        assert cat_res.status_code == 200
        cat_data = cat_res.json()
        assert cat_data["total"] >= 15
        assert len(cat_data["tools"]) >= 10
        assert "version_control" in cat_data["categories"]

        # 3. Fuzzy search for "ripgrep"
        search_res = await client.get("/v1/mcp/catalog?q=ripgrep", headers=headers)
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["total"] >= 1
        assert any("ripgrep" in t["name"] for t in search_data["tools"])

        # 4. Fuzzy search for "git diff patch"
        diff_search = await client.get("/v1/mcp/catalog?q=git+diff", headers=headers)
        assert diff_search.status_code == 200
        assert any("git_diff" == t["name"] for t in diff_search.json()["tools"])

        # 5. Filter by category
        cat_filter = await client.get("/v1/mcp/catalog?category=web_research", headers=headers)
        assert cat_filter.status_code == 200
        assert all(t["category"] == "web_research" for t in cat_filter.json()["tools"])

        # 6. Pagination
        p1 = await client.get("/v1/mcp/catalog?page=1&page_size=5", headers=headers)
        assert p1.status_code == 200
        assert len(p1.json()["tools"]) == 5

        # 7. List categories
        cats_res = await client.get("/v1/mcp/categories", headers=headers)
        assert cats_res.status_code == 200
        cats = cats_res.json()
        assert len(cats) >= 5
        cat_ids = [c["id"] for c in cats]
        assert "code_intelligence" in cat_ids

        # 8. List active FastMCP cloud servers
        srv_res = await client.get("/v1/mcp/servers", headers=headers)
        assert srv_res.status_code == 200
        srvs = srv_res.json()
        assert any(s["name"] == "code_search" for s in srvs)
        assert any(s["name"] == "git" for s in srvs)

        # 9. Cloud Tool Execution
        exec_res = await client.post(
            "/v1/mcp/execute",
            json={
                "server_name": "code_search",
                "tool_name": "ripgrep_search",
                "arguments": {"query": "class DatabaseEngine", "path": "."},
            },
            headers=headers,
        )
        assert exec_res.status_code == 200
        exec_data = exec_res.json()
        assert exec_data["success"] is True
        assert exec_data["server_name"] == "code_search"
