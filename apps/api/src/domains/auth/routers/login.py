"""User Login Endpoint."""

from __future__ import annotations

import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request, Response, status

from bee_core.db.connection import get_db_engine
from bee_api.core.config import settings
from bee_api.core.cookies import set_auth_cookies
from bee_api.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)
from bee_api.domains.auth.schemas import LoginRequest, AuthResponse

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request, response: Response) -> AuthResponse:
    """Authenticate with email and password, issue tokens, and set HttpOnly cookies."""
    db = get_db_engine()
    email_clean = body.email.strip().lower()
    user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (email_clean,))
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Fetch User's primary tenant
    membership = await db.fetch_one(
        """
        SELECT tm.*, t.name, t.type, t.slug, t.plan 
        FROM tenant_memberships tm 
        JOIN tenants t ON tm.tenant_id = t.id 
        WHERE tm.user_id = ? 
        ORDER BY tm.created_at ASC LIMIT 1
        """,
        (user["id"],),
    )
    tenant_id = membership["tenant_id"] if membership else None
    role = membership["role"] if membership else "member"

    # Mint 30-min Access Token & 7-day Refresh Token
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=tenant_id,
        role=role,
        email=user["email"],
    )
    refresh_token = create_refresh_token(user_id=user["id"])
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()

    # Track session
    user_agent = request.headers.get("user-agent", "Unknown")
    ip_addr = request.client.host if request.client else "127.0.0.1"
    await db.execute(
        """
        INSERT INTO user_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at) 
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (f"sess_{uuid.uuid4().hex[:12]}", user["id"], refresh_hash, user_agent, ip_addr, expires_at),
    )

    # Set HttpOnly Cookies
    set_auth_cookies(response, access_token, refresh_token)

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "avatar_url": user.get("avatar_url"),
        "is_verified": bool(user.get("is_verified")),
    }
    tenant_data = {
        "id": membership["tenant_id"] if membership else None,
        "name": membership["name"] if membership else "Workspace",
        "type": membership["type"] if membership else "personal",
        "role": role,
    }

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_data,
        tenant=tenant_data,
    )
