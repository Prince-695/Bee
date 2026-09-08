"""Mission DAG Graph Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_api.config import DB_PATH
from bee_core.mission.mission_store import MissionStore
from bee_api.auth.dependencies import get_current_tenant
from bee_api.domains.missions.schemas import MissionDagNode, MissionDagResponse

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(DB_PATH)


@router.get("/{mission_id}/dag", response_model=MissionDagResponse)
async def get_mission_dag(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> MissionDagResponse:
    """Retrieve 5-worker DAG execution topology and stage node progression."""
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    # The 5 autonomous engineering workers in the DAG pipeline
    nodes = [
        MissionDagNode(id="scout", label="Scout Worker", status="completed" if mission.get("stage") != "scout" else "running", worker="ScoutWorker", dependencies=[]),
        MissionDagNode(id="planner", label="Planner Worker", status="completed" if mission.get("stage") in ["builder", "verifier", "reviewer"] else ("running" if mission.get("stage") == "plan" else "pending"), worker="PlannerWorker", dependencies=["scout"]),
        MissionDagNode(id="builder", label="Builder Worker", status="completed" if mission.get("stage") in ["verifier", "reviewer"] else ("running" if mission.get("stage") == "builder" else "pending"), worker="BuilderWorker", dependencies=["planner"]),
        MissionDagNode(id="verifier", label="Verifier Worker", status="completed" if mission.get("stage") == "reviewer" else ("running" if mission.get("stage") == "verifier" else "pending"), worker="VerifierWorker", dependencies=["builder"]),
        MissionDagNode(id="reviewer", label="Reviewer Worker", status="completed" if mission.get("status") == "completed" else ("running" if mission.get("stage") == "reviewer" else "pending"), worker="ReviewerWorker", dependencies=["verifier"]),
    ]

    return MissionDagResponse(
        mission_id=mission_id,
        stage=mission.get("stage", "scout"),
        status=mission.get("status", "created"),
        nodes=nodes,
    )
