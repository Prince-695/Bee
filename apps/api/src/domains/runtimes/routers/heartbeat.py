"""Runtime Heartbeat Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import HeartbeatRequest, HeartbeatResponse
from services.data.repositories.runtime_repo import RuntimeRepository

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.post("/heartbeat", response_model=HeartbeatResponse)
async def runtime_heartbeat(
    body: HeartbeatRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> HeartbeatResponse:
    """Process heartbeat from active local runtime."""
    repo = RuntimeRepository()
    updated = await repo.record_heartbeat(runtime_id=body.runtime_id, status=body.status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Runtime '{body.runtime_id}' not found",
        )
    return HeartbeatResponse(**updated)
