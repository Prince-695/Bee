"""WhatsApp Interactive Approval Gate Inbound Webhook and Multi-Channel Action Resolver."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from pydantic import BaseModel

from bee_api.config import DB_PATH
from bee_core.channels.channel_service import (
    ChannelDispatcher,
    ChannelType,
    GateNotificationPayload,
)
from bee_core.stores.gate_store import resolve_gate

router = APIRouter(tags=["channels", "whatsapp"])
_dispatcher = ChannelDispatcher()

WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "bee_whatsapp_secret_token")


class DispatchGateAlertRequest(BaseModel):
    gate_id: str
    route_id: str
    tool_name: str
    action_summary: str
    arguments: Dict[str, Any] = {}
    risk_level: str = "critical"
    recipient_phone: Optional[str] = None
    recipient_channel: Optional[str] = None


@router.get("/webhooks/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(default=None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(default=None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(default=None, alias="hub.challenge"),
) -> Response:
    """Meta / WhatsApp Cloud API webhook verification challenge handshake."""
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return Response(content=hub_challenge or "", media_type="text/plain")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch",
    )


@router.post("/webhooks/whatsapp")
async def whatsapp_inbound_webhook(request: Request) -> Dict[str, Any]:
    """Handles interactive button replies from WhatsApp (e.g. APPROVE_<gate_id>, REJECT_<gate_id>)."""
    payload = await request.json()

    button_id: Optional[str] = None
    sender_phone: Optional[str] = None

    # Parse standard WhatsApp Cloud API interactive payload
    entry_list = payload.get("entry", [])
    for entry in entry_list:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                sender_phone = msg.get("from")
                if msg.get("type") == "interactive":
                    interactive = msg.get("interactive", {})
                    button_reply = interactive.get("button_reply", {})
                    button_id = button_reply.get("id")
                elif msg.get("type") == "button":
                    button_id = msg.get("button", {}).get("payload")

    # Direct fallback payload for test simulations
    if not button_id:
        button_id = payload.get("button_id") or payload.get("action_id")

    if not button_id:
        return {"status": "ignored", "reason": "No interactive button action found"}

    # Resolve Gate ID and Action
    if button_id.startswith("APPROVE_"):
        gate_id = button_id.replace("APPROVE_", "").strip()
        res = resolve_gate(gate_id, "approved")
        return {
            "status": "resolved",
            "gate_id": gate_id,
            "decision": "approved",
            "success": res is not None,
        }
    elif button_id.startswith("REJECT_"):
        gate_id = button_id.replace("REJECT_", "").strip()
        res = resolve_gate(gate_id, "rejected")
        return {
            "status": "resolved",
            "gate_id": gate_id,
            "decision": "rejected",
            "success": res is not None,
        }

    return {"status": "unrecognized_action", "action": button_id}


@router.post("/api/channels/dispatch-gate")
async def dispatch_gate_alert(req: DispatchGateAlertRequest) -> Dict[str, Any]:
    """Dispatch a high-priority approval gate alert to WhatsApp, Slack, and Desktop."""
    payload = GateNotificationPayload(
        gate_id=req.gate_id,
        route_id=req.route_id,
        tool_name=req.tool_name,
        action_summary=req.action_summary,
        arguments=req.arguments,
        risk_level=req.risk_level,
        recipient_phone=req.recipient_phone,
        recipient_channel=req.recipient_channel,
    )
    result = await _dispatcher.dispatch_gate_alert(payload)
    return {"success": True, "data": result}
