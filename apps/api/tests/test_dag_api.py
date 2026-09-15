"""Integration tests for Crew Templates and DAG Graph API Endpoints."""

from __future__ import annotations

import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from bee_api.main import app
from services.orchestrator.mission_orchestrator import MissionOrchestrator


@pytest.mark.anyio
async def test_crew_templates_api():
    """Verify /v1/missions/templates endpoints with valid auth token."""
    user_email = f"lead_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Signup to get token
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "SecurePassword123!", "full_name": "DAG Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List templates
        res = await client.get("/v1/missions/templates", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 3
        ids = [t["id"] for t in data]
        assert "coding_flight" in ids

        # Get single template
        res_single = await client.get("/v1/missions/templates/coding_flight", headers=headers)
        assert res_single.status_code == 200
        coding = res_single.json()
        assert coding["name"] == "Coding Flight Crew"
        assert len(coding["stages"]) == 5


@pytest.mark.anyio
async def test_dag_graph_and_gate_resolve_api():
    """Verify /v1/missions/{id}/dag and gate resolution endpoints with valid auth token."""
    user_email = f"gate_lead_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "SecurePassword123!", "full_name": "Gate Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Seed test active in-memory DAG
        from services.orchestrator.crew_templates import CODING_FLIGHT_TEMPLATE, build_dag_from_template
        from services.orchestrator.mission_orchestrator import _ACTIVE_DAGS

        test_dag = build_dag_from_template(CODING_FLIGHT_TEMPLATE, mission_id="msn-active-01", objective="Test gate resolve")
        test_dag.mark_node_waiting_gate("reviewer", gate_id="gate-test-99")
        _ACTIVE_DAGS["msn-active-01"] = test_dag

        # Now query DAG
        res_active = await client.get("/v1/missions/msn-active-01/dag", headers=headers)
        assert res_active.status_code == 200
        active_json = res_active.json()
        assert active_json["has_waiting_gates"] is True
        assert "topological_tiers" in active_json
        assert len(active_json["nodes"]) == 5

        # Resolve gate via API
        res_resolve = await client.post(
            "/v1/missions/msn-active-01/gates/gate-test-99/resolve",
            json={"action": "approved", "reason": "Authorized by developer in test"},
            headers=headers,
        )
        assert res_resolve.status_code == 200
        resolve_json = res_resolve.json()
        assert resolve_json["status"] == "approved"
        assert resolve_json["resumed"] is True
