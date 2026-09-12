"""Shared Mission Type Definitions."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MissionState(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    EXECUTING = "executing"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskNode(BaseModel):
    id: str
    label: str
    assigned_agent_id: Optional[str] = None
    status: str = "pending"
    dependencies: List[str] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None


class MissionSpec(BaseModel):
    id: str
    objective: str
    state: MissionState = MissionState.PENDING
    assigned_workers: List[str] = Field(default_factory=list)
    nodes: List[TaskNode] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
