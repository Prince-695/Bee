"""Smart Alert Dispatch Endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.channels.schemas import SmartAlertRequest, SmartAlertResponse
from bee_api.domains.channels.service import SmartChannelAlertService

router = APIRouter(prefix="/v1/channels", tags=["Alerts & Channels"])


@router.post("/dispatch", response_model=SmartAlertResponse)
async def dispatch_smart_alert(
    alert: SmartAlertRequest,
    tenant: CurrentTenantDep,
) -> SmartAlertResponse:
    """Intelligently dispatch an alert to the single first active connected channel."""
    return await SmartChannelAlertService.dispatch_smart_alert(
        tenant_id=tenant["id"],
        alert=alert,
    )
