"""Bee Cloud ↔ Local Desktop Runtime Pairing Router (/v1/runtimes/*)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/runtimes", tags=["Runtimes & Cloud Pairing"])


class RegisterRuntimeRequest(BaseModel):
    machine_name: str = Field(..., min_length=2)
    os_name: str = Field(..., description="'windows' | 'darwin' | 'linux'")
    capabilities: List[str] = Field(default_factory=lambda: ["filesystem", "terminal", "docker", "git"])


class HeartbeatRequest(BaseModel):
    runtime_id: str
    status: str = Field(default="online", description="'online' | 'busy' | 'idle'")


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


@router.post("/heartbeat")
async def runtime_heartbeat(body: HeartbeatRequest, tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Process heartbeat from active local runtime."""
    return {"runtime_id": body.runtime_id, "status": body.status, "acknowledged": True}
