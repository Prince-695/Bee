"""Security & Governance Audit Logs Router."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/security", tags=["Security & Audit Logs"])


@router.get("/audit-logs")
async def get_tenant_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: Optional[str] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Retrieve security and governance audit logs for the active tenant organization."""
    db = get_db_engine()
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"

    query = "SELECT * FROM audit_logs WHERE tenant_id = ?"
    params: List[Any] = [tenant_id]

    if action:
        query += " AND action = ?"
        params.append(action)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = await db.fetch_all(query, tuple(params))
    count_row = await db.fetch_one("SELECT count(*) as total FROM audit_logs WHERE tenant_id = ?", (tenant_id,))
    total = count_row["total"] if count_row else len(rows)

    logs = []
    for r in rows:
        row_dict = dict(r)
        try:
            row_dict["metadata"] = json.loads(row_dict.get("metadata_json") or "{}")
        except Exception:
            row_dict["metadata"] = {}
        logs.append(row_dict)

    return {"logs": logs, "total": total}
