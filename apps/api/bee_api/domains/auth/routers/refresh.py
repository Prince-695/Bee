"""Token Rotation Endpoint."""

from __future__ import annotations

import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Request, Response, status

from bee_core.db.connection import get_db_engine
from bee_api.core.config import settings
from bee_api.core.cookies import extract_tokens_from_request, set_auth_cookies
from bee_api.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from bee_api.domains.auth.schemas import RefreshRequest

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/refresh")
async def refresh_tokens(
    request: Request,
    response: Response,
    body: RefreshRequest = RefreshRequest(),
) -> Dict[str, Any]:
    """Rotate refresh token, issue a new 30-min access token, and refresh HttpOnly cookies."""
    token_str = body.refresh_token
    if not token_str:
        _, token_str = extract_tokens_from_request(request)

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token in request body or cookies",
        )

    payload = decode_token(token_str)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    refresh_hash = hashlib.sha256(token_str.encode("utf-8")).hexdigest()
    db = get_db_engine()

    session = await db.fetch_one("SELECT * FROM user_sessions WHERE refresh_token_hash = ?", (refresh_hash,))
    if not session or session.get("revoked_at"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    membership = await db.fetch_one(
        "SELECT tenant_id, role FROM tenant_memberships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
        (user_id,),
    )
    tenant_id = membership["tenant_id"] if membership else None
    role = membership["role"] if membership else "member"

    # Mint New Token Pair (Sliding 7-day session)
    new_access_token = create_access_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        email=user["email"],
    )
    new_refresh_token = create_refresh_token(user_id=user_id)
    new_refresh_hash = hashlib.sha256(new_refresh_token.encode("utf-8")).hexdigest()

    # Revoke Old Session and Persist New Sliding Session
    await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", (session["id"],))
    expires_at = (datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
    await db.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)",
        (f"sess_{uuid.uuid4().hex[:12]}", user_id, new_refresh_hash, expires_at),
    )

    # Set Updated HttpOnly Cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }
