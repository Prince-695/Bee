"""Unit tests for OAuth store and OAuth API endpoints."""

import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_core.stores.oauth_store import OAuthStore


def test_oauth_store_crud(tmp_path):
    db_file = tmp_path / "test_oauth.db"
    store = OAuthStore(str(db_file))

    # 1. Store token
    conn = store.store_token(
        user_id="user_123",
        provider="github",
        access_token="gho_test_12345",
        scopes=["repo", "read:user"],
        metadata={"username": "testdev"},
    )
    assert conn["user_id"] == "user_123"
    assert conn["provider"] == "github"
    assert conn["access_token"] == "gho_test_12345"
    assert "repo" in conn["scopes"]

    # 2. Get token
    retrieved = store.get_connector("user_123", "github")
    assert retrieved is not None
    assert retrieved["access_token"] == "gho_test_12345"

    # 3. List tokens
    all_conns = store.list_connectors("user_123")
    assert len(all_conns) == 1
    assert all_conns[0]["provider"] == "github"

    # 4. Delete token
    deleted = store.delete_connector("user_123", "github")
    assert deleted is True
    assert store.get_connector("user_123", "github") is None


def test_oauth_api_endpoints():
    client = TestClient(app)

    # 1. List supported providers
    resp = client.get("/api/oauth/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    providers = {p["id"]: p for p in data["data"]}
    assert "github" in providers
    assert "google" in providers
    assert "slack" in providers
    assert "discord" in providers

    # 2. Connect provider via API
    connect_resp = client.post(
        "/api/oauth/connect",
        json={
            "provider": "slack",
            "access_token": "xoxb-test-token",
            "scopes": ["chat:write"],
            "metadata": {"team": "Engineers"},
        },
        headers={"Authorization": "Bearer test_user_456"},
    )
    assert connect_resp.status_code == 200
    assert connect_resp.json()["success"] is True

    # 3. List user connectors
    list_resp = client.get(
        "/api/oauth/connectors",
        headers={"Authorization": "Bearer test_user_456"},
    )
    assert list_resp.status_code == 200
    conns = list_resp.json()["data"]
    assert any(c["provider"] == "slack" for c in conns)

    # 4. Demo 1-click authorize HTML response
    demo_resp = client.get(
        "/api/oauth/github/demo-authorize",
        headers={"Authorization": "Bearer test_user_456"},
    )
    assert demo_resp.status_code == 200
    assert "GitHub Connected!" in demo_resp.text

    # 5. Disconnect provider
    del_resp = client.delete(
        "/api/oauth/slack",
        headers={"Authorization": "Bearer test_user_456"},
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["disconnected"] is True
