"""Shared Agent Type Definitions."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    COORDINATOR = "coordinator"
    BROWSER = "browser"
    DEVELOPER = "developer"
    REVIEWER = "reviewer"
    TESTER = "tester"
    WORKER = "worker"
    CUSTOM = "custom"


class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    BLOCKED = "blocked"
    WAITING_INPUT = "waiting_input"
    OFFLINE = "offline"


class AgentSpec(BaseModel):
    """Specification model for built-in and worker agents."""
    id: str
    name: str
    role: AgentRole
    description: str
    avatar: str = "Bot"
    capabilities: List[str] = Field(default_factory=list)
    system_prompt: Optional[str] = None
    mcp_servers: List[str] = Field(default_factory=list)
    is_builtin: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
