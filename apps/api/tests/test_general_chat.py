"""Test Suite for Flexible General Chat (/v1/conversation)."""

from unittest.mock import AsyncMock, patch
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.stores import chat_store, conversation_store


@pytest.fixture(autouse=True)
def setup_stores():
    chat_store.init_db()
    conversation_store.init_db()


@pytest.mark.anyio
async def test_general_chat_without_workspace():
    """Verify general chat functions freely without requiring any workspace connection."""
    transport = ASGITransport(app=app)
    with patch(
        "bee_core.executor.conversation_runtime.gather_requirements",
        new=AsyncMock(
            return_value={
                "assistant_message": "Event-driven architectures decouple producers from consumers via async message buses.",
                "can_proceed": False,
                "missing_info": [],
                "requirement_summary": "Architecture explanation",
                "planning_prompt": None,
            }
        ),
    ):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Start chat with no workspace
            start_res = await client.post(
                "/v1/conversation/start",
                json={"prompt": "Explain the advantages of event-driven architectures vs polling."},
            )
            assert start_res.status_code == 200
            data = start_res.json()["data"]
            conv_id = data["conversation"]["id"]

            # 2. Get history
            hist_res = await client.get(f"/v1/conversation/{conv_id}")
            assert hist_res.status_code == 200
            assert hist_res.json()["data"]["id"] == conv_id


@pytest.mark.anyio
async def test_general_chat_with_optional_workspace():
    """Verify general chat attaches workspace context when provided."""
    transport = ASGITransport(app=app)
    with patch(
        "bee_core.executor.conversation_runtime.gather_requirements",
        new=AsyncMock(
            return_value={
                "assistant_message": "Workspace microservices analyzed successfully.",
                "can_proceed": False,
                "missing_info": [],
                "requirement_summary": "Microservice decoupling",
                "planning_prompt": None,
            }
        ),
    ):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            start_res = await client.post(
                "/v1/conversation/start",
                json={
                    "prompt": "Analyze our microservice decoupling strategy.",
                    "workspace_id": "proj_workspace_alpha_99",
                },
            )
            assert start_res.status_code == 200
            data = start_res.json()["data"]
            assert data.get("workspace_id") == "proj_workspace_alpha_99"
