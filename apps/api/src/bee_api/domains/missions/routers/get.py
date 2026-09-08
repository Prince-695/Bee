"""Mission Details Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_api.config import DB_PATH
from bee_core.mission.mission_store import MissionStore
from bee_api.auth.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(DB_PATH)


@router.get("/{mission_id}")
async def get_mission_by_id(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Get mission details and current execution state."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    return mission
