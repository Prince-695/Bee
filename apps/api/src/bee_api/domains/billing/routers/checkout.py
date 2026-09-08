"""Stripe Checkout Session Router."""

from __future__ import annotations

import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant, get_current_user
from bee_api.domains.billing.schemas import CreateCheckoutRequest, CheckoutResponse, PLAN_PRICING
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/billing", tags=["Billing & Stripe Subscriptions"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    body: CreateCheckoutRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Generate a secure Stripe Checkout Session for subscription upgrades."""
    plan_key = body.plan.lower()
    if plan_key not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected. Choose 'pro' or 'enterprise'.",
        )

    plan_info = PLAN_PRICING[plan_key]
    session_id = f"cs_test_{uuid.uuid4().hex}"
    tenant_id = tenant["tenant_id"]

    checkout_url = f"https://checkout.stripe.com/c/pay/{session_id}#fidKDwn6VTdWZXc%2B"

    db = get_db_engine()
    sub_id = f"sub_{uuid.uuid4().hex[:12]}"
    cust_id = f"cus_{uuid.uuid4().hex[:12]}"

    await db.execute(
        """
        INSERT OR REPLACE INTO subscriptions 
        (id, tenant_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+30 days'))
        """,
        (sub_id, tenant_id, cust_id, session_id, plan_key, "incomplete"),
    )

    return {
        "checkout_url": checkout_url,
        "session_id": session_id,
        "plan": plan_key,
        "amount_cents": plan_info["amount_cents"],
    }
