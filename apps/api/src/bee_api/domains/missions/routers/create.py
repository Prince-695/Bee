"""Mission Creation Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, status

from bee_api.core.config import settings
from bee_core.mission.mission_models import Mission, MissionStage
from bee_core.mission.mission_store import MissionStore
from bee_api.core.dependencies import get_current_tenant
from bee_api.security.sanitization import sanitize_html
from bee_api.domains.missions.schemas import CreateMissionRequest

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(settings.DB_PATH)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_mission(
    body: CreateMissionRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Create a new 5-Worker Autonomous Engineering Mission with sanitized inputs."""
    clean_title = sanitize_html(body.title)
    clean_description = sanitize_html(body.description) if body.description else None

    mission = Mission(
        objective=clean_title,
        signal_id=None,
        status="created",
        stage=MissionStage.SCOUT,
    )
    return _mission_store.create_mission(mission)
