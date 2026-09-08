"""User Registration Endpoint."""

from __future__ import annotations

import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Response, status

from bee_core.db.connection import get_db_engine
from bee_api.core.config import settings
from bee_api.core.cookies import set_auth_cookies
from bee_api.core.security import (
    create_access_token,
    create_refresh_token,
    generate_otp_code,
    hash_password,
)
from bee_api.auth.email_service import get_email_service
from bee_api.domains.auth.schemas import SignUpRequest, AuthResponse

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest, response: Response) -> AuthResponse:
    """Register a new user account, provision personal workspace, and set auth cookies."""
    db = get_db_engine()
    email_clean = body.email.strip().lower()
    existing = await db.fetch_one("SELECT id FROM users WHERE email = ?", (email_clean,))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
    slug = email_clean.split("@")[0] + "-" + uuid.uuid4().hex[:4]
    hashed_pw = hash_password(body.password)

    # 1. Provision Personal Organization Tenant
    await db.execute(
        "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
        (tenant_id, f"{body.full_name}'s Workspace", "personal", slug, "free"),
    )

    # 2. Provision User
    await db.execute(
        "INSERT INTO users (id, email, password_hash, full_name, is_verified) VALUES (?, ?, ?, ?, ?)",
        (user_id, email_clean, hashed_pw, body.full_name, 0),
    )

    # 3. Provision Owner Membership
    await db.execute(
        "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
        (tenant_id, user_id, "owner"),
    )

    # 4. Mint 30-min Access Token & 7-day Refresh Token
    access_token = create_access_token(user_id=user_id, tenant_id=tenant_id, email=email_clean, role="owner")
    refresh_token = create_refresh_token(user_id=user_id)
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()

    # 5. Persist Session
    await db.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)",
        (f"sess_{uuid.uuid4().hex[:12]}", user_id, refresh_hash, expires_at),
    )

    # 6. Set HttpOnly Cookies on Response
    set_auth_cookies(response, access_token, refresh_token)

    # 7. Auto-dispatch Verification OTP
    otp_code = generate_otp_code()
    otp_expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.execute(
        "INSERT INTO email_otps (id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
        (f"otp_{uuid.uuid4().hex[:12]}", email_clean, otp_code, "email_verification", otp_expires),
    )
    email_svc = get_email_service()
    await email_svc.send_otp_email(email_clean, otp_code, "email_verification")

    user_data = {"id": user_id, "email": email_clean, "full_name": body.full_name, "is_verified": False}
    tenant_data = {"id": tenant_id, "name": f"{body.full_name}'s Workspace", "type": "personal", "role": "owner"}

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_data,
        tenant=tenant_data,
    )
