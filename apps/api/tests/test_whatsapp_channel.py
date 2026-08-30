"""Unit tests for WhatsApp interactive approval webhook and channel dispatcher."""

import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_core.channels.channel_service import ChannelDispatcher, ChannelFormatter, GateNotificationPayload
from bee_core.stores.gate_store import create_gate, get_gate


def test_channel_formatters():
    payload = GateNotificationPayload(
        gate_id="gate_test_99",
        route_id="rt_123",
        tool_name="git_commit",
        action_summary="Commit 3 files with message: feat(auth)",
        risk_level="critical",
    )

    # 1. WhatsApp Formatter
    wa_msg = ChannelFormatter.format_whatsapp_message(payload)
    assert wa_msg["messaging_product"] == "whatsapp"
    assert "interactive" in wa_msg
    assert wa_msg["interactive"]["action"]["buttons"][0]["reply"]["id"] == "APPROVE_gate_test_99"

    # 2. Slack Formatter
    slack_msg = ChannelFormatter.format_slack_blocks(payload)
    assert "blocks" in slack_msg
    assert len(slack_msg["blocks"]) >= 2


def test_whatsapp_webhook_flow():
    client = TestClient(app)

    # 1. Create a pending gate
    gate = create_gate(
        route_id="rt_wa_test",
        step_num=2,
        server="git",
        tool="git_push",
        args={"branch": "main"},
        action_summary="Push changes to origin/main",
    )
    gate_id = gate["gate_id"]

    # 2. Verify webhook challenge
    verify_resp = client.get(
        "/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "bee_whatsapp_secret_token",
            "hub.challenge": "challenge_12345",
        },
    )
    assert verify_resp.status_code == 200
    assert verify_resp.text == "challenge_12345"

    # 3. Simulate interactive WhatsApp Approval Click
    wa_action_resp = client.post(
        "/webhooks/whatsapp",
        json={"button_id": f"APPROVE_{gate_id}"},
    )
    assert wa_action_resp.status_code == 200
    action_data = wa_action_resp.json()
    assert action_data["status"] == "resolved"
    assert action_data["decision"] == "approved"

    # 4. Check that gate is now approved in GateStore
    resolved_gate = get_gate(gate_id)
    assert resolved_gate is not None
    assert resolved_gate["status"] == "approved"
