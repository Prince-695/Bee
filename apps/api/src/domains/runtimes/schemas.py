"""Runtime Pairing Schemas."""

from __future__ import annotations

from typing import List
from pydantic import BaseModel, Field


class RegisterRuntimeRequest(BaseModel):
    machine_name: str = Field(..., min_length=2)
    os_name: str = Field(..., description="'windows' | 'darwin' | 'linux'")
    capabilities: List[str] = Field(default_factory=lambda: ["filesystem", "terminal", "docker", "git"])


class HeartbeatRequest(BaseModel):
    runtime_id: str
    status: str = Field(default="online", description="'online' | 'busy' | 'idle'")
