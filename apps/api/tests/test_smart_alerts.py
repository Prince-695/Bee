"""Test Suite for Smart Single-Channel Alerts and Voice Emergency (/v1/channels)."""

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
async def test_smart_single_channel_routing():
    user_email = f"ops_lead_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup user
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "OpsPassword123!", "full_name": "Ops Lead"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Check channel status before adding integrations (should default to email)
        status_res1 = await client.get("/v1/channels/status", headers=headers)
        assert status_res1.status_code == 200
        data1 = status_res1.json()
        assert data1["primary_channel"] == "email"

        # 3. Dispatch alert with only email available
        alert_res1 = await client.post(
            "/v1/channels/dispatch",
            json={
                "gate_id": "gate_101",
                "title": "Database Schema Migration Gate",
                "summary": "Confirm drop column 'legacy_token' on users table",
                "risk_level": "high",
            },
            headers=headers,
        )
        assert alert_res1.status_code == 200
        assert alert_res1.json()["dispatched_channel"] == "email"

        # 4. Connect Slack Bot Token in credentials vault
        slack_cred = await client.post(
            "/v1/credentials",
            json={
                "platform": "slack",
                "credential_key": "BOT_TOKEN",
                "credential_value": "xoxb-mock-token",
                "label": "Ops Slack",
            },
            headers=headers,
        )
        assert slack_cred.status_code == 201

        # 5. Check channel status again: primary channel must dynamically switch to slack!
        status_res2 = await client.get("/v1/channels/status", headers=headers)
        assert status_res2.status_code == 200
        data2 = status_res2.json()
        assert data2["primary_channel"] == "slack"

        # 6. Dispatch alert again: must route to single first active channel (slack) ONLY
        alert_res2 = await client.post(
            "/v1/channels/dispatch",
            json={
                "gate_id": "gate_102",
                "title": "Prod Cluster Rollout Gate",
                "summary": "Canary deployment to cluster us-east-1",
                "risk_level": "critical",
            },
            headers=headers,
        )
        assert alert_res2.status_code == 200
        assert alert_res2.json()["dispatched_channel"] == "slack"

        # 7. Trigger Sev-1 Twilio Voice emergency call escalation
        voice_res = await client.post(
            "/v1/channels/emergency-call",
            json={
                "gate_id": "gate_102",
                "phone_number": "+14155552671",
                "urgency_reason": "Sev-1 Canary threshold exceeded 5% error rate",
            },
            headers=headers,
        )
        assert voice_res.status_code == 200
        voice_data = voice_res.json()
        assert "call_sid" in voice_data
        assert voice_data["status"] == "queued"
        assert voice_data["recipient_phone"] == "+14155552671"
