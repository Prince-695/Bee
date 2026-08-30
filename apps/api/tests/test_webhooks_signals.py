"""Unit tests for Webhooks and Engineering Signal ingestion."""

import pytest
from fastapi.testclient import TestClient
from bee_api.main import app


def test_github_webhook_ingestion():
    client = TestClient(app)
    resp = client.post(
        "/webhooks/github",
        json={
            "action": "opened",
            "repository": {"full_name": "Prince-695/bee", "name": "bee"},
            "sender": {"login": "octocat"},
            "pull_request": {
                "number": 42,
                "title": "feat: add oauth service",
                "head": {"ref": "feat/oauth"},
            },
        },
        headers={"X-GitHub-Event": "pull_request"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "received"
    assert "signal_id" in data


def test_ci_and_sentry_webhooks():
    client = TestClient(app)

    # 1. CI Failure Webhook
    ci_resp = client.post(
        "/webhooks/ci",
        json={
            "repository": "Prince-695/bee",
            "branch": "feat/oauth",
            "status": "failed",
            "step": "pytest unit suite",
            "error_log": "AssertionError: 401 != 200",
        },
    )
    assert ci_resp.status_code == 200
    assert ci_resp.json()["status"] == "received"

    # 2. Sentry Webhook
    sentry_resp = client.post(
        "/webhooks/sentry",
        json={
            "project_name": "bee-api",
            "culprit": "router_agent.py",
            "level": "error",
        },
    )
    assert sentry_resp.status_code == 200
    assert sentry_resp.json()["status"] == "received"


def test_list_and_simulate_signals():
    client = TestClient(app)

    # 1. Simulate signal
    sim_resp = client.post(
        "/api/signals/simulate",
        json={
            "source": "github",
            "event_type": "pr_opened",
            "repository": "Prince-695/bee",
            "branch": "feat/simulated-branch",
            "sender": "sim_user",
        },
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["success"] is True
    assert sim_data["data"]["branch"] == "feat/simulated-branch"

    # 2. List signals
    list_resp = client.get("/api/signals?limit=10")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["success"] is True
    assert list_data["count"] >= 1
