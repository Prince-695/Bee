"""Missions and DAG Orchestration Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateMissionRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Mission goal / issue title")
    description: Optional[str] = Field(None, description="Detailed problem statement or PR context")
    project_id: Optional[str] = None
    trigger_type: str = Field(default="manual", description="'manual' | 'github_pr' | 'ci_heal' | 'sentry_issue'")


class LaunchMissionRequest(BaseModel):
    """Request to launch a dynamic multi-worker DAG flight."""
    title: str = Field(..., min_length=3, description="Flight title")
    objective: str = Field(..., min_length=5, description="High-level engineering objective")
    crew_template_id: str = Field(default="coding_flight", description="Crew template ID to execute")
    project_id: Optional[str] = Field(default="bee-core", description="Associated project ID")


class MissionListResponse(BaseModel):
    missions: List[Dict[str, Any]]
    count: int


class CrewStageSchema(BaseModel):
    id: str
    title: str
    worker_role: str
    worker_name: str
    description: str
    dependencies: List[str] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    requires_gate: bool = False
    gate_risk_level: Optional[str] = None


class CrewTemplateResponse(BaseModel):
    id: str
    name: str
    tagline: str
    description: str
    category: str
    icon: str
    estimated_duration: str
    stages: List[CrewStageSchema]


class GateResolveRequest(BaseModel):
    """Request to resolve a human authorization gate."""
    action: str = Field(..., description="'approved' | 'rejected'")
    reason: Optional[str] = Field(None, description="Developer feedback or rationale")


class GateResolveResponse(BaseModel):
    gate_id: str
    mission_id: str
    action: str
    status: str
    resumed: bool


class MissionDagNode(BaseModel):
    id: str
    label: str
    title: Optional[str] = None
    status: str
    worker: str
    dependencies: List[str] = Field(default_factory=list)
    gate_required: bool = False
    gate_id: Optional[str] = None
    gate_risk_level: Optional[str] = None
    stdout_log: Optional[str] = None
    duration_seconds: Optional[float] = 0.0


class MissionDagResponse(BaseModel):
    mission_id: str
    stage: str
    status: str
    nodes: List[MissionDagNode]
    topological_tiers: List[List[str]] = Field(default_factory=list)
    progress_percent: float = 0.0
    has_waiting_gates: bool = False
