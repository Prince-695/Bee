"""Runtime Registration Router."""

from __future__ import annotations

import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.runtimes.schemas import RegisterRuntimeRequest

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_runtime(body: RegisterRuntimeRequest, tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Register a local Bee Desktop / CLI runtime with the Cloud platform."""
    runtime_id = f"rt_{uuid.uuid4().hex[:12]}"
    api_pairing_key = f"bee_rt_{uuid.uuid4().hex}"

    return {
        "runtime_id": runtime_id,
        "machine_name": body.machine_name,
        "os_name": body.os_name,
        "capabilities": body.capabilities,
        "pairing_key": api_pairing_key,
        "status": "connected",
        "tenant_id": tenant["tenant_id"],
    }
