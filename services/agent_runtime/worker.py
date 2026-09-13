"""Unified Worker Engine: Data Models, CRUD, and System Worker Protection."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from services.data.repositories.worker_repo import WorkerRepository


class WorkerDefinition(BaseModel):
    """Unified definition for all platform workers (both system-provisioned and user-created)."""
    id: str
    name: str
    role: str
    description: str = ""
    avatar: str = "Bot"
    persona_prompt: str = ""
    capabilities: List[str] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    model: str = "gemini-3.5-flash"
    temperature: float = 0.7
    is_system: bool = False
    can_delete: bool = True
    workspace_id: str = "default"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkerCreateRequest(BaseModel):
    """Payload for creating a new custom worker via the Worker Creator."""
    name: str
    role: str
    description: str = ""
    avatar: str = "Bot"
    persona_prompt: str = ""
    capabilities: List[str] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    model: str = "gemini-3.5-flash"
    temperature: float = 0.7


class WorkerUpdateRequest(BaseModel):
    """Payload for updating an existing worker."""
    name: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    persona_prompt: Optional[str] = None
    capabilities: Optional[List[str]] = None
    allowed_tools: Optional[List[str]] = None
    model: Optional[str] = None
    temperature: Optional[float] = None


class WorkerManager:
    """Service managing worker lifecycle, persistence, and undestroyable system workers."""

    def __init__(self, repo: Optional[WorkerRepository] = None):
        self.repo = repo or WorkerRepository()

    def create_worker(
        self,
        request: WorkerCreateRequest,
        workspace_id: str = "default",
        is_system: bool = False,
        can_delete: bool = True,
        worker_id: Optional[str] = None,
    ) -> WorkerDefinition:
        """Creates and stores a new worker definition."""
        assigned_id = worker_id or f"worker-{uuid.uuid4().hex[:8]}"

        payload = {
            "id": assigned_id,
            "name": request.name,
            "role": request.role,
            "description": request.description,
            "avatar": request.avatar,
            "persona_prompt": request.persona_prompt,
            "capabilities": request.capabilities,
            "allowed_tools": request.allowed_tools,
            "model": request.model or "gemini-3.5-flash",
            "temperature": request.temperature,
            "is_system": is_system,
            "can_delete": can_delete,
            "workspace_id": workspace_id,
        }

        saved = self.repo.save_worker(payload)
        return WorkerDefinition(**saved)

    def get_worker(self, worker_id: str, workspace_id: str = "default") -> Optional[WorkerDefinition]:
        data = self.repo.get_worker(worker_id, workspace_id)
        if not data:
            return None
        return WorkerDefinition(**data)

    def list_workers(self, workspace_id: str = "default", role: Optional[str] = None) -> List[WorkerDefinition]:
        records = self.repo.list_workers(workspace_id=workspace_id, role=role)
        return [WorkerDefinition(**r) for r in records]

    def update_worker(
        self,
        worker_id: str,
        request: WorkerUpdateRequest,
        workspace_id: str = "default",
    ) -> WorkerDefinition:
        """Updates a worker. System workers retain their immutable system and can_delete flags."""
        existing = self.get_worker(worker_id, workspace_id)
        if not existing:
            raise KeyError(f"Worker '{worker_id}' not found.")

        updated_dict = existing.model_dump()
        update_data = request.model_dump(exclude_unset=True)

        for k, v in update_data.items():
            if v is not None:
                updated_dict[k] = v

        # System workers cannot lose their system/undestroyable status
        if existing.is_system:
            updated_dict["is_system"] = True
            updated_dict["can_delete"] = False

        saved = self.repo.save_worker(updated_dict)
        return WorkerDefinition(**saved)

    def delete_worker(self, worker_id: str, workspace_id: str = "default") -> bool:
        """Deletes a custom worker. System workers cannot be deleted or destroyed."""
        existing = self.get_worker(worker_id, workspace_id)
        if not existing:
            return False

        if existing.is_system or not existing.can_delete:
            raise PermissionError(
                f"Guardian Violation: Worker '{existing.name}' ({worker_id}) is an undestroyable system worker and cannot be deleted."
            )

        return self.repo.delete_worker(worker_id, workspace_id)

    def clone_worker(
        self,
        worker_id: str,
        new_name: str,
        workspace_id: str = "default",
    ) -> WorkerDefinition:
        """Clones an existing worker (even a system worker) into a new, editable custom worker."""
        source = self.get_worker(worker_id, workspace_id)
        if not source:
            raise KeyError(f"Source worker '{worker_id}' not found.")

        clone_id = f"worker-clone-{uuid.uuid4().hex[:8]}"
        payload = source.model_dump()
        payload["id"] = clone_id
        payload["name"] = new_name
        payload["is_system"] = False
        payload["can_delete"] = True
        payload["workspace_id"] = workspace_id
        payload["created_at"] = None
        payload["updated_at"] = None

        saved = self.repo.save_worker(payload)
        return WorkerDefinition(**saved)
