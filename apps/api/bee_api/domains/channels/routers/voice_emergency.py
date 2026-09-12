"""Twilio Voice Sev-1 Emergency Escalation Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.channels.schemas import TwilioVoiceEscalationRequest
from bee_api.domains.channels.service import SmartChannelAlertService

router = APIRouter(prefix="/v1/channels", tags=["Alerts & Channels"])


@router.post("/emergency-call")
async def trigger_emergency_voice_call(
    body: TwilioVoiceEscalationRequest,
    tenant: CurrentTenantDep,
) -> Dict[str, Any]:
    """Trigger automated Sev-1 emergency phone call via Twilio Voice."""
    return await SmartChannelAlertService.dispatch_voice_emergency(
        gate_id=body.gate_id,
        phone_number=body.phone_number,
        urgency_reason=body.urgency_reason,
    )
