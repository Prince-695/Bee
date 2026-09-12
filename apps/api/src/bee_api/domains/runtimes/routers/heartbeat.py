"""Runtime Heartbeat Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import HeartbeatRequest

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.post("/heartbeat")
async def runtime_heartbeat(body: HeartbeatRequest, tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Process heartbeat from active local runtime."""
    return {"runtime_id": body.runtime_id, "status": body.status, "acknowledged": True}
