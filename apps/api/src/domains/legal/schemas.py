"""Cookie Policy and Legal Consent Schemas."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class CookieItem(BaseModel):
    name: str
    purpose: str
    duration: str
    type: str = "essential"


class CookiePolicyResponse(BaseModel):
    policy_name: str = "Bee Cookie Policy"
    version: str = "1.0.0"
    description: str
    cookies: List[CookieItem]


class CookieConsentRequest(BaseModel):
    accepted: bool
    analytics_accepted: bool = False
    marketing_accepted: bool = False


class CookieConsentResponse(BaseModel):
    success: bool
    message: str
    consent_id: Optional[str] = None
