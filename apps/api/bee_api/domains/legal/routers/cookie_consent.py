"""Cookie Consent Submission Router."""

from __future__ import annotations

import uuid
from fastapi import APIRouter
from bee_api.domains.legal.schemas import CookieConsentRequest, CookieConsentResponse

router = APIRouter()


@router.post("/cookie-consent", response_model=CookieConsentResponse)
async def record_cookie_consent(payload: CookieConsentRequest) -> CookieConsentResponse:
    """Records user consent acknowledgment for statutory compliance."""
    consent_id = str(uuid.uuid4())
    msg = "Cookie preferences recorded successfully" if payload.accepted else "Essential cookies only applied"
    return CookieConsentResponse(
        success=True,
        message=msg,
        consent_id=consent_id,
    )
