"""Crew Templates API Router."""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.missions.schemas import CrewStageSchema, CrewTemplateResponse
from services.orchestrator.crew_templates import (
    CrewTemplate,
    get_crew_template,
    list_crew_templates,
)

router = APIRouter(prefix="/v1/missions/templates", tags=["Missions & DAG Orchestration"])


def _template_to_schema(t: CrewTemplate) -> CrewTemplateResponse:
    return CrewTemplateResponse(
        id=t.id,
        name=t.name,
        tagline=t.tagline,
        description=t.description,
        category=t.category,
        icon=t.icon,
        estimated_duration=t.estimated_duration,
        stages=[
            CrewStageSchema(
                id=s.id,
                title=s.title,
                worker_role=s.worker_role,
                worker_name=s.worker_name,
                description=s.description,
                dependencies=s.dependencies,
                allowed_tools=s.allowed_tools,
                requires_gate=s.requires_gate,
                gate_risk_level=s.gate_risk_level,
            )
            for s in t.stages
        ],
    )


@router.get("", response_model=List[CrewTemplateResponse])
async def get_all_crew_templates(
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> List[CrewTemplateResponse]:
    """List all registered autonomous crew templates."""
    templates = list_crew_templates()
    return [_template_to_schema(t) for t in templates]


@router.get("/{template_id}", response_model=CrewTemplateResponse)
async def get_single_crew_template(
    template_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> CrewTemplateResponse:
    """Retrieve details and topological stages for a specific crew template."""
    template = get_crew_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crew template '{template_id}' not found",
        )
    return _template_to_schema(template)
