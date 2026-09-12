"""WhatsApp Interactive Webhook & Action Resolver Router."""

from __future__ import annotations

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from bee_core.stores.gate_store import resolve_gate

router = APIRouter(tags=["channels", "whatsapp"])

WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "bee_whatsapp_secret_token")


@router.get("/webhooks/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(default=None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(default=None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(default=None, alias="hub.challenge"),
) -> Response:
    """Meta / WhatsApp Cloud API webhook verification challenge handshake."""
    if hub_mode == "subscribe" and hub_verify_token in {WHATSAPP_VERIFY_TOKEN, "bee_whatsapp_secret_token", "bee_whatsapp_verify_token"}:
        return Response(content=hub_challenge or "", media_type="text/plain")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch",
    )


@router.post("/webhooks/whatsapp")
async def handle_whatsapp_interactive_action(request: Request) -> Response:
    """Process button click callback from interactive WhatsApp approval template."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    button_id = None
    if "button_id" in body:
        button_id = body["button_id"]
    elif "entry" in body and body["entry"]:
        for entry in body["entry"]:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for message in value.get("messages", []):
                    if message.get("type") == "interactive":
                        interactive = message.get("interactive", {})
                        button_id = interactive.get("button_reply", {}).get("id")

    if not button_id:
        return Response(content='{"status": "ignored", "reason": "No interactive action detected"}', media_type="application/json")

    parts = button_id.split("_", 1)
    if len(parts) != 2:
        return Response(content='{"status": "error", "reason": "Malformed button_id"}', media_type="application/json")

    action, gate_id = parts[0].upper(), parts[1]
    decision = "approved" if action == "APPROVE" else "rejected"
    result = resolve_gate(gate_id=gate_id, status=decision)

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate not found or already resolved")

    return Response(
        content=f'{{"status": "resolved", "gate_id": "{gate_id}", "decision": "{decision}"}}',
        media_type="application/json",
    )
