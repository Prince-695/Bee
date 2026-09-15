"""Runtime Pairing and Workstation Management Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RegisterRuntimeRequest(BaseModel):
    machine_name: str = Field(..., min_length=2, description="Hostname or friendly name of the workstation")
    os_name: str = Field(..., description="'windows' | 'darwin' | 'linux'")
    capabilities: List[str] = Field(
        default_factory=lambda: ["filesystem", "terminal", "docker", "git"],
        description="List of workstation local capabilities",
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="OS architecture, CPU, or memory specs")


class RegisterRuntimeResponse(BaseModel):
    runtime_id: str
    tenant_id: str
    machine_name: str
    os_name: str
    capabilities: List[str]
    pairing_key: str = Field(..., description="Secret one-time pairing key to authenticate the workstation runtime")
    status: str
    last_heartbeat_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class HeartbeatRequest(BaseModel):
    runtime_id: str
    status: str = Field(default="online", description="'online' | 'busy' | 'idle'")


class HeartbeatResponse(BaseModel):
    runtime_id: str
    status: str
    last_heartbeat_at: str
    acknowledged: bool


class RuntimeItemResponse(BaseModel):
    id: str
    runtime_id: str
    tenant_id: str
    machine_name: str
    os_name: str
    capabilities: List[str]
    status: str = Field(description="'online' | 'busy' | 'idle' | 'offline'")
    last_heartbeat_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class RuntimeListResponse(BaseModel):
    runtimes: List[RuntimeItemResponse]
    count: int


class RuntimeStatusResponse(BaseModel):
    runtime_id: str
    machine_name: str
    os_name: str
    status: str
    capabilities: List[str]
    is_online: bool
    last_heartbeat_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
