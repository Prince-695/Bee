"""Mission SSE Streaming Endpoint."""

from __future__ import annotations

import json
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse

from bee_api.core.config import settings
from bee_core.executor.sse_stream import create_stream, get_stream
from bee_core.mission.mission_orchestrator import MissionOrchestrator
from bee_core.mission.mission_store import MissionStore
from bee_api.core.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(settings.DB_PATH)
_orchestrator = MissionOrchestrator(settings.DB_PATH)


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
