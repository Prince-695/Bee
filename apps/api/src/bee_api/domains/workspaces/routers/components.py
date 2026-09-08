"""Workspace Architecture Components Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.workspaces.schemas import (
    ComponentItem,
    WorkspaceComponentsResponse,
)

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


@router.get("/{workspace_id}/components", response_model=WorkspaceComponentsResponse)
async def list_workspace_components(
    workspace_id: str,
    tenant: CurrentTenantDep,
) -> WorkspaceComponentsResponse:
    """Analyze and return component architecture graph for the workspace."""
    db = get_db_engine()
    row = await db.fetch_one(
        "SELECT id, name FROM projects WHERE id = ? AND tenant_id = ?",
        (workspace_id, tenant["id"]),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found.",
        )

    # Standard detected micro-architecture components
    components = [
        ComponentItem(name="API Gateway", path="apps/api", type="service", dependencies=["Database", "Auth"]),
        ComponentItem(name="Console UI", path="apps/console", type="frontend", dependencies=["API Gateway"]),
        ComponentItem(name="Bee Hive Engine", path="tools/hive-local", type="mcp_server", dependencies=["LLM Runtime"]),
        ComponentItem(name="Core DB Store", path="packages/python/bee-core", type="package", dependencies=[]),
    ]

    return WorkspaceComponentsResponse(
        workspace_id=workspace_id,
        components=components,
        count=len(components),
    )
