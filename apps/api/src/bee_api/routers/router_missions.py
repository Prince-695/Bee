"""Mission lifecycle endpoints and live SSE multi-worker execution stream."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from bee_api.config import DB_PATH
from bee_core.mission.mission_models import Mission, MissionStage
from bee_core.mission.mission_orchestrator import MissionOrchestrator
from bee_core.mission.mission_store import MissionStore

router = APIRouter(prefix="/api/missions", tags=["missions"])
_mission_store = MissionStore(DB_PATH)
_orchestrator = MissionOrchestrator(DB_PATH)


class CreateMissionRequest(BaseModel):
    objective: str
    signal_id: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_mission(req: CreateMissionRequest) -> Dict[str, Any]:
    """Create and initialize a new autonomous multi-worker mission."""
    mission = Mission(
        objective=req.objective,
        signal_id=req.signal_id,
        status="created",
        stage=MissionStage.SCOUT,
    )
    created = _mission_store.create_mission(mission)
    return {"success": True, "data": created}


@router.get("")
async def list_missions(
    limit: int = Query(default=50, le=100),
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """List missions with optional status filter."""
    items = _mission_store.list_missions(limit=limit, status=status)
    return {"success": True, "data": items, "count": len(items)}


@router.get("/{mission_id}")
async def get_mission(mission_id: str) -> Dict[str, Any]:
    """Retrieve full details, worker stages, findings, and artifacts of a mission."""
    data = _mission_store.get_mission(mission_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission {mission_id} not found",
        )
    return {"success": True, "data": data}


@router.get("/{mission_id}/stream")
async def stream_mission(request: Request, mission_id: str):
    """Server-Sent Events (SSE) live streaming of the multi-worker execution pipeline."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission {mission_id} not found",
        )

    async def event_generator():
        async for evt in _orchestrator.execute_mission_stream(mission_id):
            if await request.is_disconnected():
                break
            yield {
                "event": evt["event"],
                "data": json.dumps(evt["data"]),
            }

    return EventSourceResponse(event_generator())
