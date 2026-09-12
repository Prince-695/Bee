"""Usage Records Listing Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_api.core.config import settings
from bee_core.security.budget_engine import BudgetEngine

router = APIRouter(prefix="/v1/usage", tags=["Usage & Token Telemetry"])
_budget_engine = BudgetEngine(settings.DB_PATH)


@router.get("/records")
async def get_usage_records(limit: int = 50, tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """List detailed token consumption records."""
    records = _budget_engine.list_usage_records(limit=limit)
    return {"records": records, "count": len(records)}
