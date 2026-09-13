"""Workspace Provisioner: Seeds undestroyable system workers for new workspaces and accounts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from services.agent_runtime.worker import WorkerDefinition, WorkerManager
from services.data.repositories.worker_repo import WorkerRepository


def _get_built_in_agents_dir() -> Path:
    """Locates the agents/built-in directory relative to project root."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "agents" / "built-in"
        if candidate.is_dir():
            return candidate
    return Path.cwd() / "agents" / "built-in"


class WorkspaceProvisioner:
    """Automatically sets up the core 6 autonomous workers for any workspace."""

    def __init__(self, worker_manager: Optional[WorkerManager] = None):
        self.manager = worker_manager or WorkerManager()

    def provision_system_workers(self, workspace_id: str = "default") -> List[WorkerDefinition]:
        """Seeds all built-in system workers (Manager, Coordinator, Browser, Researcher, Developer, Reviewer).
        
        All seeded workers are flagged as undestroyable: `is_system=True` and `can_delete=False`.
        """
        built_in_dir = _get_built_in_agents_dir()
        if not built_in_dir.is_dir():
            return []

        provisioned: List[WorkerDefinition] = []

        for json_file in sorted(built_in_dir.glob("*.json")):
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
            except Exception:
                continue

            worker_id = data.get("id") or f"worker-system-{json_file.stem}"
            data["id"] = worker_id
            data["workspace_id"] = workspace_id
            data["is_system"] = True
            data["can_delete"] = False
            data["model"] = data.get("model") or "gemini-3.5-flash"

            saved = self.manager.repo.save_worker(data)
            provisioned.append(WorkerDefinition(**saved))

        return provisioned
