"""Unit tests for /v1/workers API Endpoints, System Worker Protection, and Cloning."""

import pytest
from starlette.testclient import TestClient
from bee_api.main import app
from bee_core.stores.user_store import init_user_db


@pytest.fixture
def client():
    init_user_db()
    return TestClient(app)


def test_list_workers_provisions_system_workers(client: TestClient):
    """Verify GET /v1/workers lists all workers and provisions the core 6 system workers."""
    resp = client.get("/v1/workers?workspace_id=default")
    assert resp.status_code == 200
    workers = resp.json()
    assert len(workers) >= 6

    names = {w["name"] for w in workers}
    assert "Bee Manager" in names
    assert "Bee Coordinator" in names
    assert "Browser Worker" in names
    assert "Bee Researcher" in names
    assert "Bee Developer" in names
    assert "Bee Reviewer" in names

    # Verify model is gemini-3.5-flash
    for w in workers:
        assert w["model"] == "gemini-3.5-flash"


def test_create_and_delete_custom_worker(client: TestClient):
    """Verify creating a custom worker via POST /v1/workers and deleting it."""
    payload = {
        "name": "DevOps Engineer",
        "role": "devops",
        "description": "Deploys containers and checks health",
        "avatar": "Server",
        "persona_prompt": "You are a DevOps automation expert.",
        "capabilities": ["docker", "k8s"],
        "allowed_tools": ["run_command", "view_file"],
        "model": "gemini-3.5-flash",
        "temperature": 0.3,
    }
    create_resp = client.post("/v1/workers?workspace_id=default", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    worker_id = created["id"]
    assert created["name"] == "DevOps Engineer"
    assert created["can_delete"] is True
    assert created["is_system"] is False

    # Retrieve
    get_resp = client.get(f"/v1/workers/{worker_id}?workspace_id=default")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "DevOps Engineer"

    # Delete custom worker -> succeeds with 204
    del_resp = client.delete(f"/v1/workers/{worker_id}?workspace_id=default")
    assert del_resp.status_code == 204

    # Verify deleted
    get_after = client.get(f"/v1/workers/{worker_id}?workspace_id=default")
    assert get_after.status_code == 404


def test_system_worker_deletion_forbidden(client: TestClient):
    """Verify attempting to delete a system worker returns 403 Forbidden."""
    # List to get a system worker ID
    list_resp = client.get("/v1/workers?workspace_id=default")
    workers = list_resp.json()
    system_worker = next(w for w in workers if w["is_system"])

    # Attempt delete
    del_resp = client.delete(f"/v1/workers/{system_worker['id']}?workspace_id=default")
    assert del_resp.status_code == 403
    assert "undestroyable system worker" in del_resp.json()["detail"]


def test_clone_system_worker(client: TestClient):
    """Verify cloning a system worker creates a new custom worker via POST /v1/workers/{id}/clone."""
    list_resp = client.get("/v1/workers?workspace_id=default")
    workers = list_resp.json()
    system_worker = next(w for w in workers if w["role"] == "manager")

    clone_resp = client.post(
        f"/v1/workers/{system_worker['id']}/clone?workspace_id=default",
        json={"new_name": "Agile Scrum Lead"},
    )
    assert clone_resp.status_code == 201
    cloned = clone_resp.json()
    assert cloned["name"] == "Agile Scrum Lead"
    assert cloned["is_system"] is False
    assert cloned["can_delete"] is True

    # Cloned worker CAN be deleted
    del_resp = client.delete(f"/v1/workers/{cloned['id']}?workspace_id=default")
    assert del_resp.status_code == 204
