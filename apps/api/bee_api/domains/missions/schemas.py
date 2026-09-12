"""Missions and DAG Orchestration Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateMissionRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Mission goal / issue title")
    description: Optional[str] = Field(None, description="Detailed problem statement or PR context")
    project_id: Optional[str] = None
    trigger_type: str = Field(default="manual", description="'manual' | 'github_pr' | 'ci_heal' | 'sentry_issue'")


class MissionListResponse(BaseModel):
    missions: List[Dict[str, Any]]
    count: int


class MissionDagNode(BaseModel):
    id: str
    label: str
    status: str
    worker: str
    dependencies: List[str] = Field(default_factory=list)


class MissionDagResponse(BaseModel):
    mission_id: str
    stage: str
    status: str
    nodes: List[MissionDagNode]
