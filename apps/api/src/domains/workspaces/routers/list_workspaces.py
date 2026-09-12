"""Workspace Listing Endpoint."""

from __future__ import annotations

import json
from typing import Any, Dict
from fastapi import APIRouter

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.workspaces.schemas import WorkspaceItem, WorkspaceListResponse

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(tenant: CurrentTenantDep) -> WorkspaceListResponse:
    """List all connected repositories and workspaces for the active tenant."""
    db = get_db_engine()
    rows = await db.fetch_all(
        "SELECT * FROM projects WHERE tenant_id = ? ORDER BY created_at DESC",
        (tenant["id"],),
    )
    workspaces = []
    for r in rows:
        settings_dict = {}
        if r.get("settings_json"):
            try:
                settings_dict = json.loads(r["settings_json"])
            except Exception:
                settings_dict = {}
        workspaces.append(
            WorkspaceItem(
                id=r["id"],
                tenant_id=r["tenant_id"],
                name=r["name"],
                repo_url=r.get("repo_url"),
                default_branch=r.get("default_branch") or "main",
                local_path=r.get("local_path"),
                settings=settings_dict,
                created_at=str(r.get("created_at", "")),
            )
        )
    return WorkspaceListResponse(workspaces=workspaces, count=len(workspaces))
