"""Worker Creator API: Endpoints for managing custom and system workers (/v1/workers)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel

from services.agent_runtime.provisioner import WorkspaceProvisioner
from services.agent_runtime.worker import (
    WorkerCreateRequest,
    WorkerDefinition,
    WorkerManager,
    WorkerUpdateRequest,
)

router = APIRouter(prefix="/v1/workers", tags=["Workers"])
_worker_manager = WorkerManager()
_provisioner = WorkspaceProvisioner(_worker_manager)


class CloneWorkerRequest(BaseModel):
    new_name: str


@router.get("", response_model=List[WorkerDefinition])
async def list_workers(
    workspace_id: str = Query("default", description="Target workspace ID"),
    role: Optional[str] = Query(None, description="Optional role filter"),
) -> List[WorkerDefinition]:
    """Lists all available workers (both built-in system workers and custom workers)."""
    # Ensure system workers exist for the workspace
    workers = _worker_manager.list_workers(workspace_id=workspace_id, role=role)
    if not workers and workspace_id == "default":
        workers = _provisioner.provision_system_workers(workspace_id=workspace_id)
        if role:
            workers = [w for w in workers if w.role == role]
    return workers


@router.post("", response_model=WorkerDefinition, status_code=status.HTTP_201_CREATED)
async def create_worker(
    request: WorkerCreateRequest,
    workspace_id: str = Query("default", description="Target workspace ID"),
) -> WorkerDefinition:
    """Creates a new custom worker using the unified Worker Creator."""
    return _worker_manager.create_worker(request, workspace_id=workspace_id)


@router.post("/provision", response_model=List[WorkerDefinition])
async def provision_workers(
    workspace_id: str = Query("default", description="Workspace to provision system workers for"),
) -> List[WorkerDefinition]:
    """Provisions the 6 core system workers (Manager, Coordinator, Browser, Researcher, Developer, Reviewer)."""
    return _provisioner.provision_system_workers(workspace_id=workspace_id)


@router.get("/{worker_id}", response_model=WorkerDefinition)
async def get_worker(
    worker_id: str,
    workspace_id: str = Query("default"),
) -> WorkerDefinition:
    """Retrieves a worker definition by ID."""
    worker = _worker_manager.get_worker(worker_id, workspace_id=workspace_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker '{worker_id}' not found.",
        )
    return worker


@router.put("/{worker_id}", response_model=WorkerDefinition)
async def update_worker(
    worker_id: str,
    request: WorkerUpdateRequest,
    workspace_id: str = Query("default"),
) -> WorkerDefinition:
    """Updates a worker's configuration. System workers cannot lose their system status."""
    try:
        return _worker_manager.update_worker(worker_id, request, workspace_id=workspace_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker '{worker_id}' not found.",
        )


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_worker(
    worker_id: str,
    workspace_id: str = Query("default"),
) -> Response:
    """Deletes a custom worker. Returns 403 Forbidden if the worker is an undestroyable system worker."""
    try:
        deleted = _worker_manager.delete_worker(worker_id, workspace_id=workspace_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker '{worker_id}' not found.",
            )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )


@router.post("/{worker_id}/clone", response_model=WorkerDefinition, status_code=status.HTTP_201_CREATED)
async def clone_worker(
    worker_id: str,
    request: CloneWorkerRequest,
    workspace_id: str = Query("default"),
) -> WorkerDefinition:
    """Clones an existing worker (even a system worker) into a new, editable custom worker."""
    try:
        return _worker_manager.clone_worker(
            worker_id=worker_id,
            new_name=request.new_name,
            workspace_id=workspace_id,
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source worker '{worker_id}' not found.",
        )
