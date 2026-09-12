"""Pull Cloud Updates to Local Sync Router."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from bee_api.core.dependencies import get_current_tenant
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/sync", tags=["Sync Engine"])


@router.get("/pull")
async def pull_sync(
    since: Optional[str] = Query(None, description="ISO timestamp for incremental delta sync"),
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Pull updated missions and approvals from Cloud to Local."""
    engine = get_db_engine()
    tenant_id = tenant.get("tenant_id") or tenant.get("id")

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
        "missions": [dict(m) for m in missions],
        "approvals": [dict(a) for a in approvals],
    }
