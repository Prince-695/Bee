"""Runtime Listing Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import RuntimeItemResponse, RuntimeListResponse
from services.data.repositories.runtime_repo import RuntimeRepository

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.get("", response_model=RuntimeListResponse)
async def list_runtimes(
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> RuntimeListResponse:
    """List all workstation runtimes paired with the active tenant organization."""
    repo = RuntimeRepository()
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    runtimes = await repo.list_runtimes(tenant_id=tenant_id)
    return RuntimeListResponse(
        runtimes=[RuntimeItemResponse(**r) for r in runtimes],
        count=len(runtimes),
    )
