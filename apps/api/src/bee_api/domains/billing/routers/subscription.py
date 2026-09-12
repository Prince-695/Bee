"""Subscription Status Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/billing", tags=["Billing & Stripe Subscriptions"])


@router.get("/subscription")
async def get_subscription_status(tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Retrieve current subscription status and plan limits for the tenant."""
    db = get_db_engine()
    sub = await db.fetch_one(
        "SELECT * FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1",
        (tenant["tenant_id"],),
    )
    if not sub:
        return {
            "tenant_id": tenant["tenant_id"],
            "plan": "starter",
            "status": "active",
            "current_period_end": None,
            "cancel_at_period_end": False,
        }

    return {
        "tenant_id": tenant["tenant_id"],
        "plan": sub["plan"],
        "status": sub["status"],
        "current_period_end": sub.get("current_period_end"),
        "cancel_at_period_end": bool(sub.get("cancel_at_period_end", 0)),
    }
