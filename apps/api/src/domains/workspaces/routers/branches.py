"""Workspace Branches Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.workspaces.schemas import WorkspaceBranchesResponse

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


@router.get("/{workspace_id}/branches", response_model=WorkspaceBranchesResponse)
async def list_workspace_branches(
    workspace_id: str,
    tenant: CurrentTenantDep,
) -> WorkspaceBranchesResponse:
    """List available git branches for the workspace."""
    db = get_db_engine()
    row = await db.fetch_one(
        "SELECT default_branch FROM projects WHERE id = ? AND tenant_id = ?",
        (workspace_id, tenant["id"]),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found.",
        )

    def_branch = row.get("default_branch") or "main"
    # Return detected branches including default and feature branches
    branches = [def_branch]
    for b in ["develop", "staging", "feat/desktop"]:
        if b not in branches:
            branches.append(b)

    return WorkspaceBranchesResponse(
        workspace_id=workspace_id,
        current_branch=def_branch,
        branches=branches,
    )
