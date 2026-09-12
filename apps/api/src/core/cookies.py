"""HttpOnly Cookie Helpers for Token Management.

Supports 30-minute Access Tokens and 7-day Refresh Tokens.
"""

from __future__ import annotations

from typing import Optional, Tuple
from fastapi import Request, Response
from bee_api.core.config import settings

COOKIE_ACCESS_TOKEN_KEY = "bee_access_token"
COOKIE_REFRESH_TOKEN_KEY = "bee_refresh_token"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """Injects secure HttpOnly cookies for both access and refresh tokens."""
    is_secure = settings.ENVIRONMENT == "production" and settings.API_URL_SCHEME == "https"

    access_max_age = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400

    response.set_cookie(
        key=COOKIE_ACCESS_TOKEN_KEY,
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key=COOKIE_REFRESH_TOKEN_KEY,
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Removes both authentication cookies upon logout or session revocation."""
    response.delete_cookie(key=COOKIE_ACCESS_TOKEN_KEY, path="/")
    response.delete_cookie(key=COOKIE_REFRESH_TOKEN_KEY, path="/")


def extract_tokens_from_request(request: Request) -> Tuple[Optional[str], Optional[str]]:
    """Extracts access and refresh tokens from Authorization header or HttpOnly cookies.

    Order of precedence for access token:
    1. Header `Authorization: Bearer <token>` (Mobile/Swagger/CLI)
    2. Cookie `bee_access_token` (Web/Desktop)
    """
    access_token: Optional[str] = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ", 1)[1].strip()

    if not access_token:
        access_token = request.cookies.get(COOKIE_ACCESS_TOKEN_KEY)

    refresh_token = request.headers.get("X-Refresh-Token") or request.cookies.get(COOKIE_REFRESH_TOKEN_KEY)

    return access_token, refresh_token
