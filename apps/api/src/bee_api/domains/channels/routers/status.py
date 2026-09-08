"""Alert Channels Connectivity Status Endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.channels.schemas import ChannelsStatusResponse
from bee_api.domains.channels.service import SmartChannelAlertService

router = APIRouter(prefix="/v1/channels", tags=["Alerts & Channels"])


@router.get("/status", response_model=ChannelsStatusResponse)
async def get_channels_status(tenant: CurrentTenantDep) -> ChannelsStatusResponse:
    """Check connectivity and priority order of external alert channels."""
    return await SmartChannelAlertService.get_channels_status(tenant["id"])
