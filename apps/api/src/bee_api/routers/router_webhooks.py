"""Webhook ingestion endpoints for GitHub, CI/CD, Slack, Sentry, and generic engineering signals."""

from __future__ import annotations

import hashlib
import hmac
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from bee_api.config import DB_PATH
from bee_core.signals.signal_model import EngineeringSignal
from bee_core.signals.signal_store import SignalStore
from bee_core.webhook_queue import task_queue

router = APIRouter(tags=["webhooks", "signals"])
GITHUB_WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
_signal_store = SignalStore(DB_PATH)


class SimulateSignalRequest(BaseModel):
    source: str = "github"
    event_type: str = "pr_opened"
    repository: str = "Prince-695/bee"
    branch: Optional[str] = "feat/auth-service"
    sender: Optional[str] = "developer"
    payload: Dict[str, Any] = Field(default_factory=dict)


def verify_github_signature(payload_bytes: bytes, signature: str) -> bool:
    if not GITHUB_WEBHOOK_SECRET:
        return True
    expected = "sha256=" + hmac.new(
        GITHUB_WEBHOOK_SECRET.encode(),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhooks/github")
async def github_webhook(request: Request) -> Dict[str, Any]:
    payload_bytes = await request.body()
    payload = await request.json()
    signature = request.headers.get("X-Hub-Signature-256", "")
    event_type = request.headers.get("X-GitHub-Event", "pull_request")
    action = payload.get("action", "")
    repo_name = payload.get("repository", {}).get("full_name") or payload.get("repository", {}).get("name", "workspace")
    sender = payload.get("sender", {}).get("login", "github")

    if GITHUB_WEBHOOK_SECRET and not verify_github_signature(payload_bytes, signature):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")

    pr = payload.get("pull_request", {})
    branch = pr.get("head", {}).get("ref") or payload.get("ref", "").replace("refs/heads/", "") or "main"

    normalized_type = f"pr_{action}" if event_type == "pull_request" and action else event_type

    sig = EngineeringSignal(
        source="github",
        event_type=normalized_type,
        repository=repo_name,
        branch=branch,
        sender=sender,
        payload=payload,
    )
    _signal_store.record_signal(sig)

    # Resume any waiting task queue items
    task_queue.resume_task("github_pr", {"event_type": event_type, "repo": repo_name, "pr": pr})
    return {"status": "received", "signal_id": sig.signal_id}


@router.post("/webhooks/ci")
async def ci_webhook(request: Request) -> Dict[str, Any]:
    """Ingest CI/CD build failure and test report webhooks."""
    payload = await request.json()
    repo_name = payload.get("repository", "workspace")
    branch = payload.get("branch", "main")
    sender = payload.get("sender", "ci_runner")
    status = payload.get("status", "failed")

    sig = EngineeringSignal(
        source="ci",
        event_type="ci_failure" if status in ("failed", "failure", "error") else "ci_success",
        repository=repo_name,
        branch=branch,
        sender=sender,
        payload=payload,
    )
    _signal_store.record_signal(sig)
    return {"status": "received", "signal_id": sig.signal_id}


@router.post("/webhooks/sentry")
async def sentry_webhook(request: Request) -> Dict[str, Any]:
    """Ingest Sentry and incident monitoring alert payloads."""
    payload = await request.json()
    repo_name = payload.get("project_name", payload.get("project", "workspace"))
    culprit = payload.get("culprit", "application")

    sig = EngineeringSignal(
        source="sentry",
        event_type="alert",
        repository=repo_name,
        sender="sentry_monitor",
        payload=payload,
    )
    _signal_store.record_signal(sig)
    return {"status": "received", "signal_id": sig.signal_id}


@router.post("/webhooks/slack")
async def slack_webhook(request: Request) -> Dict[str, Any]:
    payload = await request.json()
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}

    event = payload.get("event", {})
    event_type = event.get("type", "message")
    user = event.get("user", "slack_user")
    channel = event.get("channel", "general")
    text = event.get("text", "")

    if event.get("bot_id"):
        return {"status": "ignored"}

    sig = EngineeringSignal(
        source="slack",
        event_type="chat_trigger",
        repository="workspace",
        sender=user,
        payload={"channel": channel, "text": text},
    )
    _signal_store.record_signal(sig)
    task_queue.resume_task("slack_message", {"user": user, "channel": channel, "text": text})
    return {"status": "received", "signal_id": sig.signal_id}


@router.post("/webhooks/generic")
async def generic_webhook(request: Request) -> Dict[str, Any]:
    """Generic JSON webhook endpoint for external integrations."""
    payload = await request.json()
    sig = EngineeringSignal(
        source=payload.get("source", "generic"),
        event_type=payload.get("event_type", "custom_event"),
        repository=payload.get("repository", "workspace"),
        branch=payload.get("branch"),
        sender=payload.get("sender"),
        payload=payload,
    )
    _signal_store.record_signal(sig)
    return {"status": "received", "signal_id": sig.signal_id}


@router.get("/api/signals")
async def list_signals(
    limit: int = Query(default=50, le=100),
    source: Optional[str] = None,
    event_type: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """Query ingested engineering signals."""
    items = _signal_store.list_signals(limit=limit, source=source, event_type=event_type, status=status)
    return {"success": True, "data": items, "count": len(items)}


@router.post("/api/signals/simulate")
async def simulate_signal(req: SimulateSignalRequest) -> Dict[str, Any]:
    """Simulate an incoming engineering signal for instant testing."""
    sig = EngineeringSignal(
        source=req.source,
        event_type=req.event_type,
        repository=req.repository,
        branch=req.branch,
        sender=req.sender,
        payload=req.payload or {"simulated": True, "title": f"Simulated {req.event_type} on {req.repository}"},
    )
    created = _signal_store.record_signal(sig)
    return {"success": True, "data": created}