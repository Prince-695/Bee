"""Unit tests for WorkspaceProvisioner and the 6 core undestroyable system workers."""

import pytest
from services.agent_runtime.provisioner import WorkspaceProvisioner
from services.agent_runtime.worker import WorkerManager


@pytest.fixture
def provisioner():
    return WorkspaceProvisioner()


def test_provision_system_workers(provisioner: WorkspaceProvisioner):
    """Verify all 6 core system workers are provisioned with correct roles, permissions, and gemini-3.5-flash."""
    ws = "ws-provision-test"
    workers = provisioner.provision_system_workers(workspace_id=ws)
    assert len(workers) == 6

    worker_roles = {w.role: w for w in workers}
    expected_roles = {"manager", "coordinator", "browser_assistant", "researcher", "developer", "reviewer"}
    assert set(worker_roles.keys()) == expected_roles

    # Check Manager
    manager_worker = worker_roles["manager"]
    assert manager_worker.name == "Bee Manager"
    assert manager_worker.is_system is True
    assert manager_worker.can_delete is False
    assert manager_worker.model == "gemini-3.5-flash"
    assert "milestone_tracking" in manager_worker.capabilities

    # Check Browser Worker
    browser_worker = worker_roles["browser_assistant"]
    assert browser_worker.name == "Browser Worker"
    assert browser_worker.is_system is True
    assert browser_worker.can_delete is False
    assert "48h_history_synthesis" in browser_worker.capabilities

    # Check Reviewer
    reviewer_worker = worker_roles["reviewer"]
    assert reviewer_worker.name == "Bee Reviewer"
    assert "adversarial_critique" in reviewer_worker.capabilities

    # Verify they are undestroyable in the WorkerManager
    mgr = provisioner.manager
    for w in workers:
        with pytest.raises(PermissionError):
            mgr.delete_worker(w.id, workspace_id=ws)
