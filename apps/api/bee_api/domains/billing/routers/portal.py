"""Stripe Customer Portal Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.billing.schemas import PortalResponse
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/billing", tags=["Billing & Stripe Subscriptions"])


@router.post("/portal", response_model=PortalResponse)
async def create_billing_portal(tenant: Dict[str, Any] = Depends(get_current_tenant)):
    """Create Stripe Customer Portal session URL for self-serve management."""
    db = get_db_engine()
    sub = await db.fetch_one(
        "SELECT stripe_customer_id FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1",
        (tenant["tenant_id"],),
    )
    if not sub or not sub.get("stripe_customer_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active billing profile or Stripe customer found for this tenant",
        )

    customer_id = sub["stripe_customer_id"]
    portal_url = f"https://billing.stripe.com/p/session/test_{customer_id}"
    return {"portal_url": portal_url}
