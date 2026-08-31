"""Autonomous 5-Worker Missions & DAG Router (/v1/missions/*)."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel, Field

from bee_api.config import DB_PATH
from bee_core.mission.mission_models import Mission, MissionStage
from bee_core.mission.mission_orchestrator import MissionOrchestrator
from bee_core.mission.mission_store import MissionStore
from bee_api.auth.dependencies import get_current_user, get_current_tenant

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(DB_PATH)
_orchestrator = MissionOrchestrator(DB_PATH)


class CreateMissionRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Mission goal / issue title")
    description: Optional[str] = Field(None, description="Detailed problem statement or PR context")
    project_id: Optional[str] = None
    trigger_type: str = Field(default="manual", description="'manual' | 'github_pr' | 'ci_heal' | 'sentry_issue'")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_mission(
    body: CreateMissionRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Create a new 5-Worker Autonomous Engineering Mission."""
    mission = Mission(
        objective=body.title,
        signal_id=None,
        status="created",
        stage=MissionStage.SCOUT,
    )
    created = _mission_store.create_mission(mission)
    return created


@router.get("")
async def list_tenant_missions(
    limit: int = Query(default=50, le=100),
    status: Optional[str] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """List missions for the tenant organization."""
    missions = _mission_store.list_missions(limit=limit, status=status)
    return {"missions": missions, "count": len(missions)}


@router.get("/{mission_id}")
async def get_mission_by_id(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Get mission details and current DAG state."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    return mission


@router.get("/{mission_id}/stream")
async def stream_mission_execution(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Stream real-time SSE execution logs, worker updates, and DAG stage events."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    async def event_generator():
        async for event in _orchestrator.execute_mission_stream(mission_id):
            yield {"event": event.get("event", "message"), "data": json.dumps(event.get("data", {}))}

    return EventSourceResponse(event_generator())
