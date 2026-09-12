"""Billing & Subscription Schemas."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


PLAN_PRICING = {
    "starter": {"name": "Starter", "amount_cents": 0, "currency": "usd"},
    "pro": {"name": "Pro Co-Engineer", "amount_cents": 4900, "currency": "usd"},
    "enterprise": {"name": "Enterprise Team", "amount_cents": 24900, "currency": "usd"},
}


class CreateCheckoutRequest(BaseModel):
    plan: str = Field(..., description="'pro' | 'enterprise'")
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    plan: str
    amount_cents: int


class PortalResponse(BaseModel):
    portal_url: str
