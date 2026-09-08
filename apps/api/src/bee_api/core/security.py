"""Cryptographic Security Core: Password Hashing, Tokens, and OTPs.

Enforces 30-minute Access Tokens and 7-day Refresh Tokens.
"""

from __future__ import annotations

import os
import secrets
import string
import hashlib
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from bee_api.core.config import settings

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hashes a password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(
    user_id: str,
    tenant_id: Optional[str] = None,
    role: str = "member",
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a 30-minute JWT access token with user, tenant, and role claims."""
    delta = expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + delta
    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "email": email,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Creates a 7-day refresh token with unique JTI."""
    delta = expires_delta or timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.now(timezone.utc) + delta
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": hashlib.sha256(os.urandom(32)).hexdigest()[:16],
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def generate_otp_code(length: int = 6) -> str:
    """Generates a cryptographically random numeric OTP code."""
    return "".join(secrets.choice(string.digits) for _ in range(length))
