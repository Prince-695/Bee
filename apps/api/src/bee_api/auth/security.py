"""Cryptographic security utilities for Authentication, Passwords, Tokens, and OTPs.

Unified enterprise implementation backed by bee_api.core.security.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from datetime import timedelta

from bee_api.core.config import settings
from bee_api.core.security import (
    hash_password,
    verify_password,
    create_access_token as _core_create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
    JWT_ALGORITHM,
)

JWT_SECRET = settings.JWT_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS


def create_access_token(
    user_id: str,
    tenant_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
    role: str = "member",
    email: Optional[str] = None,
) -> str:
    """Creates a 30-minute JWT access token with user, tenant, and role claims."""
    return _core_create_access_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        email=email,
        expires_delta=expires_delta,
    )


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "generate_otp_code",
    "JWT_SECRET",
    "JWT_ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS",
]
