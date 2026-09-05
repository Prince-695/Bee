"""Bee Cloud ↔ Local Desktop Synchronization Router (/v1/sync/*)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/sync", tags=["Sync Engine"])


class PushSyncPayload(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    missions: List[Dict[str, Any]] = Field(default_factory=list)
    approvals: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/push", status_code=status.HTTP_200_OK)
async def push_sync(
    payload: PushSyncPayload,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Ingest offline missions and approvals from a local runtime into cloud storage."""
    engine = get_db_engine()
    tenant_id = tenant["tenant_id"]
    synced_mission_ids = []
    synced_counts = {"missions": 0, "approvals": 0}

    # 1. Upsert Missions
    for m in payload.missions:
        m_id = m.get("mission_id") or m.get("id")
        if not m_id:
            continue
        synced_mission_ids.append(m_id)
        now = datetime.now(timezone.utc).isoformat()
        findings_str = m.get("findings_json")
        if not isinstance(findings_str, str):
            findings_str = json.dumps(findings_str or [])

        artifacts_str = m.get("artifacts_json")
        if not isinstance(artifacts_str, str):
            artifacts_str = json.dumps(artifacts_str or {})

        await engine.execute(
            """
            INSERT INTO missions (
                mission_id, signal_id, objective, status, stage, active_worker,
                findings_json, artifacts_json, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(mission_id) DO UPDATE SET
                objective = excluded.objective,
                status = excluded.status,
                stage = excluded.stage,
                active_worker = excluded.active_worker,
                findings_json = excluded.findings_json,
                artifacts_json = excluded.artifacts_json,
                updated_at = excluded.updated_at
            """,
            (
                m_id,
                m.get("signal_id"),
                m.get("objective") or m.get("title", "Untitled Mission"),
                m.get("status", "completed"),
                m.get("stage", "scout"),
                m.get("active_worker", "inspector"),
                findings_str,
                artifacts_str,
                m.get("created_at", now),
                m.get("updated_at", now),
            ),
        )
        synced_counts["missions"] += 1

    # 2. Upsert Approvals
    for a in payload.approvals:
        a_id = a.get("id")
        if not a_id:
            continue
        payload_str = a.get("payload_json")
        if not isinstance(payload_str, str):
            payload_str = json.dumps(payload_str or {})
        now = datetime.now(timezone.utc).isoformat()

        await engine.execute(
            """
            INSERT INTO approval_gates (
                id, tenant_id, mission_id, flight_id, action_type, payload_json, status, token_hash, created_at, resolved_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                resolved_at = excluded.resolved_at
            """,
            (
                a_id,
                tenant_id,
                a.get("mission_id"),
                a.get("flight_id"),
                a.get("action_type", "push"),
                payload_str,
                a.get("status", "pending"),
                a.get("token_hash", "hash"),
                a.get("created_at", now),
                a.get("resolved_at"),
            ),
        )
        synced_counts["approvals"] += 1

    return {
        "success": True,
        "tenant_id": tenant_id,
        "synced_counts": synced_counts,
        "synced_mission_ids": synced_mission_ids,
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/pull")
async def pull_sync(
    since: Optional[str] = Query(None, description="ISO timestamp of last sync"),
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Pull updated missions and approvals from Cloud to Local."""
    engine = get_db_engine()
    tenant_id = tenant["tenant_id"]

    query_missions = "SELECT * FROM missions"
    params_m: list[Any] = []
    if since:
        query_missions += " WHERE updated_at > ?"
        params_m.append(since)
    query_missions += " ORDER BY updated_at DESC LIMIT 50"

    missions = await engine.fetch_all(query_missions, tuple(params_m))

    query_approvals = "SELECT * FROM approval_gates WHERE tenant_id = ?"
    approvals = await engine.fetch_all(query_approvals, (tenant_id,))

    return {
        "tenant_id": tenant_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "missions": missions,
        "approvals": approvals,
    }


@router.get("/status")
async def sync_status(tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Check Cloud sync engine status for the current tenant."""
    return {
        "tenant_id": tenant["tenant_id"],
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
