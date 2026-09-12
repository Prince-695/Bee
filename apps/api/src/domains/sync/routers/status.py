"""Sync Health & Delta Status Router."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/sync", tags=["Sync Engine"])


@router.get("/status")
async def get_sync_status(tenant: Dict[str, Any] = Depends(get_current_tenant)) -> Dict[str, Any]:
    """Check Cloud sync engine status for the current tenant."""
    return {
        "tenant_id": tenant.get("tenant_id") or tenant.get("id"),
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
