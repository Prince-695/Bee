"""Mission DAG Graph and Gate Resolution Endpoints."""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from bee_api.core.config import settings
from bee_core.mission.mission_orchestrator import MissionOrchestrator
from bee_core.mission.mission_store import MissionStore
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.missions.schemas import (
    GateResolveRequest,
    GateResolveResponse,
    MissionDagNode,
    MissionDagResponse,
)

router = APIRouter(prefix="/v1/missions", tags=["Missions & DAG Orchestration"])
_mission_store = MissionStore(settings.DB_PATH)
_orchestrator = MissionOrchestrator(settings.DB_PATH)


@router.get("/{mission_id}/dag", response_model=MissionDagResponse)
async def get_mission_dag(
    mission_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> MissionDagResponse:
    """Retrieve dynamic DAG execution topology, node progression, and topological tiers."""
    # Check if active in-memory DAG exists
    active_dag = _orchestrator.get_dag(mission_id)
    if active_dag:
        nodes: List[MissionDagNode] = []
        for n in active_dag.nodes.values():
            nodes.append(
                MissionDagNode(
                    id=n.id,
                    label=n.title,
                    title=n.title,
                    status=n.status.value,
                    worker=n.assigned_worker_id or n.assigned_role,
                    dependencies=list(n.dependencies),
                    gate_required=n.gate_required,
                    gate_id=n.gate_id,
                    gate_risk_level=n.gate_risk_level,
                    stdout_log=n.stdout_log[-1000:] if n.stdout_log else None,
                    duration_seconds=n.duration_seconds,
                )
            )
        return MissionDagResponse(
            mission_id=mission_id,
            stage="running" if not active_dag.is_finished() else "completed",
            status="completed" if active_dag.is_finished() else "running",
            nodes=nodes,
            topological_tiers=active_dag.get_topological_tiers(),
            progress_percent=active_dag.progress_percent(),
            has_waiting_gates=active_dag.has_waiting_gates(),
        )

    # Fallback to persistent store
    mission = _mission_store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    # Standard fallback 5-node topology
    current_stage = mission.get("stage", "scout")
    is_completed = mission.get("status") == "completed"

    nodes = [
        MissionDagNode(
            id="scout",
            label="Scout Worker",
            title="Codebase & Dependency Mapping",
            status="completed" if current_stage != "scout" or is_completed else "running",
            worker="ScoutWorker",
            dependencies=[],
            duration_seconds=1.2,
        ),
        MissionDagNode(
            id="planner",
            label="Planner Worker",
            title="DAG Route & Strategy Formulation",
            status="completed" if current_stage in ["builder", "verifier", "reviewer"] or is_completed else ("running" if current_stage == "plan" else "pending"),
            worker="PlannerWorker",
            dependencies=["scout"],
            duration_seconds=0.8,
        ),
        MissionDagNode(
            id="builder",
            label="Builder Worker",
            title="Patch Application & Code Synthesis",
            status="completed" if current_stage in ["verifier", "reviewer"] or is_completed else ("running" if current_stage == "builder" else "pending"),
            worker="BuilderWorker",
            dependencies=["planner"],
            duration_seconds=2.4,
        ),
        MissionDagNode(
            id="verifier",
            label="Verifier Worker",
            title="Regression & Test Suite QA",
            status="completed" if current_stage == "reviewer" or is_completed else ("running" if current_stage == "verifier" else "pending"),
            worker="VerifierWorker",
            dependencies=["builder"],
            duration_seconds=1.8,
        ),
        MissionDagNode(
            id="reviewer",
            label="Reviewer Worker",
            title="Architecture & Gate Verification",
            status="completed" if is_completed else ("running" if current_stage == "reviewer" else "pending"),
            worker="ReviewerWorker",
            dependencies=["verifier"],
            gate_required=True,
            gate_risk_level="MEDIUM",
            duration_seconds=1.1,
        ),
    ]

    tiers = [["scout"], ["planner"], ["builder"], ["verifier"], ["reviewer"]]
    completed_count = sum(1 for n in nodes if n.status == "completed")

    return MissionDagResponse(
        mission_id=mission_id,
        stage=current_stage,
        status=mission.get("status", "created"),
        nodes=nodes,
        topological_tiers=tiers,
        progress_percent=round((completed_count / len(nodes)) * 100.0, 1),
        has_waiting_gates=any(n.status == "waiting_gate" for n in nodes),
    )


@router.post("/{mission_id}/gates/{gate_id}/resolve", response_model=GateResolveResponse)
async def resolve_mission_gate(
    mission_id: str,
    gate_id: str,
    body: GateResolveRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> GateResolveResponse:
    """Resolve an interactive approval gate to unblock execution of a paused DAG node."""
    success = _orchestrator.resolve_gate(mission_id=mission_id, gate_id=gate_id, action=body.action)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active gate '{gate_id}' not found for mission '{mission_id}'",
        )

    return GateResolveResponse(
        gate_id=gate_id,
        mission_id=mission_id,
        action=body.action,
        status="approved" if body.action.lower() == "approved" else "rejected",
        resumed=body.action.lower() == "approved",
    )
