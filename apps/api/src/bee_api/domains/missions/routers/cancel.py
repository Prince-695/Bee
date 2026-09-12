"""Mission Cancellation Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_api.core.config import settings
from bee_core.mission.mission_store import MissionStore
from bee_api.core.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(settings.DB_PATH)


@router.post("/{mission_id}/cancel")
async def cancel_mission(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Gracefully terminate a running autonomous mission."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    _mission_store.update_mission_status(mission_id, "cancelled")
    return {
        "mission_id": mission_id,
        "status": "cancelled",
        "message": f"Mission {mission_id} has been gracefully aborted.",
    }
