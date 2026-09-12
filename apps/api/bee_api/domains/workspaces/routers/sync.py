"""Workspace Synchronization Endpoint."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


class WorkspaceSyncRequest(BaseModel):
    branch: Optional[str] = Field(default=None, description="Current checked out branch")
    commit_sha: Optional[str] = Field(default=None, description="Head commit hash")
    dirty: bool = Field(default=False, description="Whether working tree has uncommitted edits")


@router.post("/{workspace_id}/sync")
async def sync_workspace(
    workspace_id: str,
    body: WorkspaceSyncRequest,
    tenant: CurrentTenantDep,
) -> Dict[str, Any]:
    """Synchronize local repository state and git branches with cloud workspace."""
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

    if body.branch:
        await db.execute(
            "UPDATE projects SET default_branch = ? WHERE id = ?",
            (body.branch, workspace_id),
        )

    return {
        "workspace_id": workspace_id,
        "synced": True,
        "branch": body.branch,
        "commit_sha": body.commit_sha,
        "dirty": body.dirty,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }
