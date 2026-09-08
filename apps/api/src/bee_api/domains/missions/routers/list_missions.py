"""Mission Listing Endpoint."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query

from bee_api.core.config import settings
from bee_core.mission.mission_store import MissionStore
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.missions.schemas import MissionListResponse

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(settings.DB_PATH)


@router.get("", response_model=MissionListResponse)
async def list_tenant_missions(
    limit: int = Query(default=50, le=100),
    status: Optional[str] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> MissionListResponse:
    """List missions for the active tenant organization."""
    missions = _mission_store.list_missions(limit=limit, status=status)
    return MissionListResponse(missions=missions, count=len(missions))
