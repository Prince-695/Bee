"""Cookie Policy Specification Router."""

from __future__ import annotations

from fastapi import APIRouter
from bee_api.domains.legal.schemas import CookieItem, CookiePolicyResponse

router = APIRouter()


@router.get("/cookie-policy", response_model=CookiePolicyResponse)
async def get_cookie_policy() -> CookiePolicyResponse:
    """Returns the legal declaration of cookies utilized by the Bee platform."""
    return CookiePolicyResponse(
        description="Bee uses strictly necessary cookies to ensure secure session continuity and CSRF mitigation.",
        cookies=[
            CookieItem(
                name="bee_access_token",
                purpose="Maintains authenticated session for API and dashboard interactions.",
                duration="30 minutes",
                type="essential",
            ),
            CookieItem(
                name="bee_refresh_token",
                purpose="Allows transparent session renewal without requiring re-login within 7 days.",
                duration="7 days",
                type="essential",
            ),
        ],
    )
