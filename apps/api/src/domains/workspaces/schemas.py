"""Workspaces and Repositories Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ConnectWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128, description="Workspace / Project name")
    repo_url: Optional[str] = Field(default=None, description="GitHub / GitLab repository URL")
    default_branch: str = Field(default="main", description="Target default git branch")
    local_path: Optional[str] = Field(default=None, description="Local folder filesystem path for desktop mode")
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom workspace settings")


class WorkspaceItem(BaseModel):
    id: str
    tenant_id: str
    name: str
    repo_url: Optional[str] = None
    default_branch: str = "main"
    local_path: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class WorkspaceListResponse(BaseModel):
    workspaces: List[WorkspaceItem]
    count: int


class ComponentItem(BaseModel):
    name: str
    path: str
    type: str = "service"
    dependencies: List[str] = Field(default_factory=list)


class WorkspaceComponentsResponse(BaseModel):
    workspace_id: str
    components: List[ComponentItem]
    count: int


class WorkspaceBranchesResponse(BaseModel):
    workspace_id: str
    current_branch: str
    branches: List[str]
