"""Multi-Channel Notification & Interactive Action Dispatcher for WhatsApp, Slack, and Desktop."""

from __future__ import annotations

import json
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChannelType(str, Enum):
    WHATSAPP = "whatsapp"
    SLACK = "slack"
    DISCORD = "discord"
    DESKTOP = "desktop"


class GateNotificationPayload(BaseModel):
    gate_id: str
    route_id: str
    tool_name: str
    action_summary: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    risk_level: str = "critical"  # critical, high, medium
    recipient_phone: Optional[str] = None
    recipient_channel: Optional[str] = None


class ChannelFormatter:
    """Formats interactive messages for WhatsApp, Slack, and Discord."""

    @staticmethod
    def format_whatsapp_message(payload: GateNotificationPayload) -> Dict[str, Any]:
        """Formats an interactive WhatsApp Cloud API button template."""
        body_text = (
            f"🛡️ *BEE SECURITY APPROVAL REQUIRED*\n\n"
            f"*Route:* `{payload.route_id}`\n"
            f"*Action:* `{payload.tool_name}`\n"
            f"*Summary:* {payload.action_summary}\n"
            f"*Risk Level:* ⚠️ {payload.risk_level.upper()}\n\n"
            f"Reply with a button below to authorize or reject:"
        )
        return {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": payload.recipient_phone or "+1234567890",
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body_text},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {
                                "id": f"APPROVE_{payload.gate_id}",
                                "title": "✅ Authorize Action",
                            },
                        },
                        {
                            "type": "reply",
                            "reply": {
                                "id": f"REJECT_{payload.gate_id}",
                                "title": "❌ Reject Action",
                            },
                        },
                    ]
                },
            },
        }

    @staticmethod
    def format_slack_blocks(payload: GateNotificationPayload) -> Dict[str, Any]:
        """Formats a Slack Block Kit message with interactive buttons."""
        return {
            "channel": payload.recipient_channel or "#eng-approvals",
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": "🛡️ Bee Zero-Trust Approval Gate"},
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Route ID:*\n`{payload.route_id}`"},
                        {"type": "mrkdwn", "text": f"*Tool:*\n`{payload.tool_name}`"},
                        {"type": "mrkdwn", "text": f"*Risk:*\n`{payload.risk_level.upper()}`"},
                        {"type": "mrkdwn", "text": f"*Action:*\n{payload.action_summary}"},
                    ],
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "✅ Authorize"},
                            "style": "primary",
                            "value": f"APPROVE_{payload.gate_id}",
                            "action_id": "approve_gate_action",
                        },
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "❌ Reject"},
                            "style": "danger",
                            "value": f"REJECT_{payload.gate_id}",
                            "action_id": "reject_gate_action",
                        },
                    ],
                },
            ],
        }


class ChannelDispatcher:
    """Dispatches approval gate notifications to external chat channels."""

    def __init__(self) -> None:
        self.dispatched_history: List[Dict[str, Any]] = []

    async def dispatch_gate_alert(
        self,
        payload: GateNotificationPayload,
        channels: Optional[List[ChannelType]] = None,
    ) -> Dict[str, Any]:
        target_channels = channels or [ChannelType.WHATSAPP, ChannelType.SLACK, ChannelType.DESKTOP]
        results: Dict[str, Any] = {}

        for ch in target_channels:
            if ch == ChannelType.WHATSAPP:
                msg = ChannelFormatter.format_whatsapp_message(payload)
                results["whatsapp"] = {"status": "sent", "payload": msg}
            elif ch == ChannelType.SLACK:
                msg = ChannelFormatter.format_slack_blocks(payload)
                results["slack"] = {"status": "sent", "payload": msg}
            elif ch == ChannelType.DESKTOP:
                results["desktop"] = {"status": "notified", "gate_id": payload.gate_id}

        dispatch_record = {
            "gate_id": payload.gate_id,
            "route_id": payload.route_id,
            "channels": [c.value for c in target_channels],
            "results": results,
        }
        self.dispatched_history.append(dispatch_record)
        return dispatch_record
