"""Runtime Status and Health Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import RuntimeStatusResponse
from services.data.repositories.runtime_repo import RuntimeRepository

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.get("/{runtime_id}/status", response_model=RuntimeStatusResponse)
async def get_runtime_status(
    runtime_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> RuntimeStatusResponse:
    """Retrieve detailed connectivity status and health of a specific runtime."""
    repo = RuntimeRepository()
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    # List to perform stale check and fetch latest
    runtimes = await repo.list_runtimes(tenant_id=tenant_id)
    matched = next((r for r in runtimes if r["runtime_id"] == runtime_id), None)
    if not matched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Runtime '{runtime_id}' not found for tenant '{tenant_id}'",
        )

    is_online = matched["status"] in ("online", "busy", "idle", "connected")
    return RuntimeStatusResponse(
        runtime_id=matched["runtime_id"],
        machine_name=matched["machine_name"],
        os_name=matched["os_name"],
        status=matched["status"],
        capabilities=matched["capabilities"],
        is_online=is_online,
        last_heartbeat_at=matched["last_heartbeat_at"],
        metadata=matched["metadata"],
    )
