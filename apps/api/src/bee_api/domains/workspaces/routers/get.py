"""Workspace Details Endpoint."""

from __future__ import annotations

import json
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.workspaces.schemas import WorkspaceItem

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


@router.get("/{workspace_id}", response_model=WorkspaceItem)
async def get_workspace(
    workspace_id: str,
    tenant: CurrentTenantDep,
) -> WorkspaceItem:
    """Retrieve details of a connected workspace within the active tenant."""
    db = get_db_engine()
    row = await db.fetch_one(
        "SELECT * FROM projects WHERE id = ? AND tenant_id = ?",
        (workspace_id, tenant["id"]),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found in organization.",
        )

    settings_dict = {}
    if row.get("settings_json"):
        try:
            settings_dict = json.loads(row["settings_json"])
        except Exception:
            settings_dict = {}

    return WorkspaceItem(
        id=row["id"],
        tenant_id=row["tenant_id"],
        name=row["name"],
        repo_url=row.get("repo_url"),
        default_branch=row.get("default_branch") or "main",
        local_path=row.get("local_path"),
        settings=settings_dict,
        created_at=str(row.get("created_at", "")),
    )
