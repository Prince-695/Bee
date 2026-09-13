"""Unit tests for Worker Engine, Worker Creator, and System Worker Protection."""

import pytest
from services.agent_runtime.worker import (
    WorkerCreateRequest,
    WorkerDefinition,
    WorkerManager,
    WorkerUpdateRequest,
)


@pytest.fixture
def manager():
    return WorkerManager()


def test_create_and_get_worker(manager: WorkerManager):
    """Verify creating and retrieving a custom worker."""
    req = WorkerCreateRequest(
        name="Data Analyst",
        role="analyst",
        description="Analyzes data trends and metrics",
        avatar="BarChart",
        persona_prompt="You are a data analyst who loves charts.",
        capabilities=["sql_query", "chart_generation"],
        allowed_tools=["read_file", "search_web"],
        model="gemini-3.5-flash",
        temperature=0.4,
    )
    worker = manager.create_worker(req, workspace_id="ws-test")
    assert worker.id.startswith("worker-")
    assert worker.name == "Data Analyst"
    assert worker.model == "gemini-3.5-flash"
    assert worker.temperature == 0.4
    assert worker.can_delete is True
    assert worker.is_system is False

    retrieved = manager.get_worker(worker.id, workspace_id="ws-test")
    assert retrieved is not None
    assert retrieved.name == "Data Analyst"
    assert "sql_query" in retrieved.capabilities


def test_list_workers_filtering(manager: WorkerManager):
    """Verify listing workers by workspace and role."""
    manager.create_worker(
        WorkerCreateRequest(name="Dev 1", role="developer"),
        workspace_id="ws-list-test",
    )
    manager.create_worker(
        WorkerCreateRequest(name="QA 1", role="reviewer"),
        workspace_id="ws-list-test",
    )

    all_ws = manager.list_workers(workspace_id="ws-list-test")
    assert len(all_ws) >= 2

    devs = manager.list_workers(workspace_id="ws-list-test", role="developer")
    assert any(w.name == "Dev 1" for w in devs)
    assert not any(w.name == "QA 1" for w in devs)


def test_update_custom_worker(manager: WorkerManager):
    """Verify updating custom worker parameters."""
    worker = manager.create_worker(
        WorkerCreateRequest(name="Draft Worker", role="custom"),
        workspace_id="ws-update",
    )
    updated = manager.update_worker(
        worker.id,
        WorkerUpdateRequest(name="Polished Worker", temperature=0.2),
        workspace_id="ws-update",
    )
    assert updated.name == "Polished Worker"
    assert updated.temperature == 0.2


def test_system_worker_cannot_be_destroyed(manager: WorkerManager):
    """Verify that system workers are undestroyable and raise PermissionError on delete."""
    sys_worker = manager.create_worker(
        WorkerCreateRequest(name="System Orchestrator", role="coordinator"),
        workspace_id="ws-sys",
        is_system=True,
        can_delete=False,
        worker_id="worker-system-core",
    )
    assert sys_worker.is_system is True
    assert sys_worker.can_delete is False

    # Attempting to delete must fail with PermissionError
    with pytest.raises(PermissionError) as exc_info:
        manager.delete_worker("worker-system-core", workspace_id="ws-sys")
    assert "undestroyable system worker" in str(exc_info.value)

    # Worker still exists
    still_there = manager.get_worker("worker-system-core", workspace_id="ws-sys")
    assert still_there is not None


def test_clone_system_worker_into_custom(manager: WorkerManager):
    """Verify cloning a system worker creates an independent, editable, deletable custom worker."""
    sys_worker = manager.create_worker(
        WorkerCreateRequest(
            name="Original Lead",
            role="manager",
            persona_prompt="Original prompt",
        ),
        workspace_id="ws-clone",
        is_system=True,
        can_delete=False,
        worker_id="worker-system-lead",
    )

    cloned = manager.clone_worker(
        worker_id="worker-system-lead",
        new_name="Custom Forked Lead",
        workspace_id="ws-clone",
    )
    assert cloned.id != "worker-system-lead"
    assert cloned.name == "Custom Forked Lead"
    assert cloned.is_system is False
    assert cloned.can_delete is True

    # The clone CAN be deleted
    deleted = manager.delete_worker(cloned.id, workspace_id="ws-clone")
    assert deleted is True

    # The original system worker is untouched
    orig = manager.get_worker("worker-system-lead", workspace_id="ws-clone")
    assert orig is not None
