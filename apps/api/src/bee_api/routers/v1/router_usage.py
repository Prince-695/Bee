"""Token Budget & Usage Telemetry Router (/v1/usage/*)."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.config import DB_PATH
from bee_core.security.budget_engine import BudgetEngine
from bee_api.auth.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/usage", tags=["Usage & Token Telemetry"])
_budget_engine = BudgetEngine(DB_PATH)


@router.get("/spend")
async def get_spend_metrics(tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Get total LLM tokens used and total USD cost for the tenant."""
    spend = _budget_engine.get_aggregate_spend()
    return {
        "tenant_id": tenant["tenant_id"],
        "total_prompt_tokens": spend["total_prompt_tokens"],
        "total_completion_tokens": spend["total_completion_tokens"],
        "total_tokens": spend["total_tokens"],
        "total_cost_usd": spend["total_cost_usd"],
    }


@router.get("/records")
async def get_usage_records(limit: int = 50, tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """List detailed token consumption records."""
    records = _budget_engine.list_usage_records(limit=limit)
    return {"records": records, "count": len(records)}
