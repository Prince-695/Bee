"""Comprehensive Integration Test Suite for /v1/memory and /v1/context REST API Endpoints."""

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
async def test_memory_and_context_api_suite():
    user_email = f"mem_lead_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user to get token
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "SecurePassword123!", "full_name": "Memory Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. POST /v1/memory - Create Semantic Memory
        create_res = await client.post(
            "/v1/memory",
            json={
                "title": "FastAPI Dependency Injection",
                "content": "Use FastAPI Depends() for all database repositories and authentication guards.",
                "type": "semantic",
                "scope": "project",
                "project_id": "proj-api-test",
                "tags": ["fastapi", "architecture", "di"],
                "citations": [
                    {
                        "source_id": "task-di-arch",
                        "source_type": "task",
                        "location": "src/main.py",
                    }
                ],
            },
            headers=headers,
        )
        assert create_res.status_code == 201
        mem_data = create_res.json()
        mem_id = mem_data["id"]
        assert mem_id.startswith("mem-")
        assert mem_data["title"] == "FastAPI Dependency Injection"
        assert len(mem_data["citations"]) == 1

        # 3. GET /v1/memory - List memories with filters
        list_res = await client.get(
            "/v1/memory?scope=project&type=semantic&project_id=proj-api-test",
            headers=headers,
        )
        assert list_res.status_code == 200
        memories = list_res.json()
        assert len(memories) >= 1
        assert any(m["id"] == mem_id for m in memories)

        # 4. POST /v1/memory/links - Create Context Graph Edge
        link_res = await client.post(
            "/v1/memory/links",
            json={
                "source_id": mem_id,
                "source_type": "memory",
                "target_id": "proj-api-test",
                "target_type": "project",
                "relation": "BELONGS_TO",
                "weight": 1.0,
            },
            headers=headers,
        )
        assert link_res.status_code == 201
        link_data = link_res.json()
        link_id = link_data["id"]
        assert link_id.startswith("link-")

        # 5. GET /v1/memory/:id - Get Memory with Graph Links
        get_res = await client.get(f"/v1/memory/{mem_id}", headers=headers)
        assert get_res.status_code == 200
        detail = get_res.json()
        assert detail["memory"]["id"] == mem_id
        assert len(detail["links"]) >= 1

        # 6. PATCH /v1/memory/:id - Update Memory
        patch_res = await client.patch(
            f"/v1/memory/{mem_id}",
            json={"title": "Updated FastAPI Architecture", "confidence": 0.98},
            headers=headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Updated FastAPI Architecture"
        assert patch_res.json()["confidence"] == 0.98

        # 7. POST /v1/memory/search - Hybrid Search
        search_res = await client.post(
            "/v1/memory/search",
            json={
                "query": "FastAPI Depends injection architecture",
                "scope": "project",
                "top_k": 3,
            },
            headers=headers,
        )
        assert search_res.status_code == 200
        results = search_res.json()
        assert len(results) >= 1
        assert results[0]["memory"]["id"] == mem_id
        assert results[0]["score"] > 0.2

        # 8. GET /v1/context - Active Context
        ctx_res = await client.get("/v1/context", headers=headers)
        assert ctx_res.status_code == 200
        ctx_data = ctx_res.json()
        assert "workspace_id" in ctx_data
        assert "morning_briefing" in ctx_data

        # 9. POST /v1/context/synthesize - Morning Executive Briefing Synthesis
        synth_res = await client.post(
            "/v1/context/synthesize",
            json={
                "git_summary": "On branch V1: all 18 tests passing",
                "browser_permission_granted": True,
                "signed_in_account": "gh-lead",
                "browser_history": [
                    {
                        "url": "https://docs.fastapi.tiangolo.com",
                        "title": "FastAPI Docs: Dependencies",
                        "account_id": "gh-lead",
                        "category": "docs",
                    }
                ],
            },
            headers=headers,
        )
        assert synth_res.status_code == 200
        synth_data = synth_res.json()
        briefing = synth_data["morning_briefing"]
        assert "FastAPI Docs: Dependencies" in briefing["browser_research_summary"]

        # 10. DELETE /v1/memory/:id - Forget / Purge Privacy Guarantee
        del_res = await client.delete(f"/v1/memory/{mem_id}", headers=headers)
        assert del_res.status_code == 204

        # Confirm deleted
        get_del = await client.get(f"/v1/memory/{mem_id}", headers=headers)
        assert get_del.status_code == 404

        # Confirm associated graph link was also cascaded
        links_res = await client.get(f"/v1/memory/links/{mem_id}", headers=headers)
        assert links_res.status_code == 200
        assert len(links_res.json()) == 0
