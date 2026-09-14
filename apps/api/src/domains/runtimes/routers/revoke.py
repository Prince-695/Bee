"""Runtime Revocation Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant
from services.data.repositories.runtime_repo import RuntimeRepository

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.delete("/{runtime_id}", status_code=status.HTTP_200_OK)
async def revoke_runtime(
    runtime_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Revoke pairing key and unregister a workstation runtime."""
    repo = RuntimeRepository()
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    revoked = await repo.revoke_runtime(runtime_id=runtime_id, tenant_id=tenant_id)
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Runtime '{runtime_id}' not found for tenant '{tenant_id}'",
        )

    return {
        "success": True,
        "runtime_id": runtime_id,
        "message": f"Runtime '{runtime_id}' pairing successfully revoked",
    }
