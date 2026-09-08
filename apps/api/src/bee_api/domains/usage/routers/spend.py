"""Token Spend Metrics Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_api.core.config import settings
from bee_core.security.budget_engine import BudgetEngine

router = APIRouter(prefix="/v1/usage", tags=["Usage & Token Telemetry"])
_budget_engine = BudgetEngine(settings.DB_PATH)


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
