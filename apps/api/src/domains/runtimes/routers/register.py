"""Runtime Registration Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import RegisterRuntimeRequest, RegisterRuntimeResponse
from services.data.repositories.runtime_repo import RuntimeRepository

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.post("/register", response_model=RegisterRuntimeResponse, status_code=status.HTTP_201_CREATED)
async def register_runtime(
    body: RegisterRuntimeRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> RegisterRuntimeResponse:
    """Register a local Bee Desktop / CLI runtime with the Cloud platform."""
    repo = RuntimeRepository()
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    created = await repo.register_runtime(
        tenant_id=tenant_id,
        machine_name=body.machine_name,
        os_name=body.os_name,
        capabilities=body.capabilities,
        metadata=body.metadata,
    )
    return RegisterRuntimeResponse(**created)
