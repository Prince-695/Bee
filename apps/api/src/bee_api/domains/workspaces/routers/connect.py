"""Workspace Connection Endpoint."""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict
from fastapi import APIRouter, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.workspaces.schemas import ConnectWorkspaceRequest, WorkspaceItem

router = APIRouter(prefix="/v1/workspaces", tags=["Workspaces & Repositories"])


@router.post("", response_model=WorkspaceItem, status_code=status.HTTP_201_CREATED)
async def connect_workspace(
    body: ConnectWorkspaceRequest,
    tenant: CurrentTenantDep,
) -> WorkspaceItem:
    """Connect a code repository or local folder workspace to the active tenant."""
    db = get_db_engine()
    workspace_id = f"proj_{uuid.uuid4().hex[:12]}"
    settings_str = json.dumps(body.settings or {})

    await db.execute(
        """
        INSERT INTO projects (id, tenant_id, name, repo_url, default_branch, local_path, settings_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            workspace_id,
            tenant["id"],
            body.name,
            body.repo_url,
            body.default_branch,
            body.local_path,
            settings_str,
        ),
    )

    row = await db.fetch_one("SELECT * FROM projects WHERE id = ?", (workspace_id,))
    return WorkspaceItem(
        id=row["id"],
        tenant_id=row["tenant_id"],
        name=row["name"],
        repo_url=row.get("repo_url"),
        default_branch=row.get("default_branch") or "main",
        local_path=row.get("local_path"),
        settings=body.settings or {},
        created_at=str(row.get("created_at", "")),
    )
