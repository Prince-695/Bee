"""Authentication and Identity Router (/v1/auth/*)."""

from __future__ import annotations

import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from bee_core.db.connection import get_db_engine
from bee_api.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
)
from bee_api.auth.dependencies import get_current_user
from bee_api.auth.email_service import get_email_service

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


# ─── Pydantic Request & Response Schemas ────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$", description="Valid email address")
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2)


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class OtpSendRequest(BaseModel):
    purpose: str = Field(default="email_verification", description="'email_verification' | 'password_reset'")


class OtpVerifyRequest(BaseModel):
    otp_code: str = Field(..., min_length=6, max_length=6)
    purpose: str = Field(default="email_verification")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")


class ResetPasswordRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    tenant: Dict[str, Any]


# ─── 1. POST /v1/auth/signup ───────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest):
    """Register a new user account with email and password."""
    db = get_db_engine()
    existing = await db.fetch_one("SELECT id FROM users WHERE email = ?", (body.email.lower(),))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
    slug = body.email.split("@")[0].lower() + "-" + uuid.uuid4().hex[:4]
    hashed_pw = hash_password(body.password)

    # Create Personal Tenant
    await db.execute(
        "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
        (tenant_id, f"{body.full_name}'s Workspace", "personal", slug, "free"),
    )

    # Create User
    await db.execute(
        "INSERT INTO users (id, email, password_hash, full_name, is_verified) VALUES (?, ?, ?, ?, ?)",
        (user_id, body.email.lower(), hashed_pw, body.full_name, 0),
    )

    # Bind Tenant Membership as Owner
    await db.execute(
        "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
        (tenant_id, user_id, "owner"),
    )

    # Issue Tokens
    access_token = create_access_token(user_id=user_id, tenant_id=tenant_id)
    refresh_token = create_refresh_token(user_id=user_id)
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    # Store Session
    await db.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)",
        (f"sess_{uuid.uuid4().hex[:12]}", user_id, refresh_hash, expires_at),
    )

    # Auto-dispatch Verification OTP
    otp_code = generate_otp_code()
    otp_expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.execute(
        "INSERT INTO email_otps (id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
        (f"otp_{uuid.uuid4().hex[:12]}", body.email.lower(), otp_code, "email_verification", otp_expires),
    )
    email_service = get_email_service()
    await email_service.send_otp_email(body.email.lower(), otp_code, "email_verification")

    user_data = {"id": user_id, "email": body.email.lower(), "full_name": body.full_name, "is_verified": False}
    tenant_data = {"id": tenant_id, "name": f"{body.full_name}'s Workspace", "type": "personal", "role": "owner"}

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data,
        "tenant": tenant_data,
    }


# ─── 2. POST /v1/auth/login ────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request):
    """Authenticate with email and password to receive access & refresh tokens."""
    db = get_db_engine()
    user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (body.email.lower(),))
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Fetch User's primary tenant
    membership = await db.fetch_one(
        "SELECT tm.*, t.name, t.type, t.slug, t.plan FROM tenant_memberships tm "
        "JOIN tenants t ON tm.tenant_id = t.id WHERE tm.user_id = ? ORDER BY tm.created_at ASC LIMIT 1",
        (user["id"],),
    )
    tenant_id = membership["tenant_id"] if membership else None

    # Issue Tokens
    access_token = create_access_token(user_id=user["id"], tenant_id=tenant_id)
    refresh_token = create_refresh_token(user_id=user["id"])
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    # Track session
    user_agent = request.headers.get("user-agent", "Unknown")
    ip_addr = request.client.host if request.client else "127.0.0.1"
    await db.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        (f"sess_{uuid.uuid4().hex[:12]}", user["id"], refresh_hash, user_agent, ip_addr, expires_at),
    )

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
        "role": membership["role"] if membership else "owner",
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data,
        "tenant": tenant_data,
    }


# ─── 3. POST /v1/auth/logout ───────────────────────────────────────────────────

@router.post("/logout")
async def logout(body: Optional[RefreshRequest] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """Invalidate current session and revoke refresh tokens."""
    db = get_db_engine()
    if body and body.refresh_token:
        refresh_hash = hashlib.sha256(body.refresh_token.encode("utf-8")).hexdigest()
        await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE refresh_token_hash = ?", (refresh_hash,))
    else:
        await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", (user["id"],))

    return {"message": "Successfully logged out and revoked active session"}


# ─── 4. POST /v1/auth/refresh ──────────────────────────────────────────────────

@router.post("/refresh")
async def refresh_tokens(body: RefreshRequest):
    """Rotate refresh token and issue a new access token."""
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    refresh_hash = hashlib.sha256(body.refresh_token.encode("utf-8")).hexdigest()
    db = get_db_engine()

    session = await db.fetch_one("SELECT * FROM user_sessions WHERE refresh_token_hash = ?", (refresh_hash,))
    if not session or session.get("revoked_at"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked")

    user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    membership = await db.fetch_one("SELECT tenant_id FROM tenant_memberships WHERE user_id = ? LIMIT 1", (user_id,))
    tenant_id = membership["tenant_id"] if membership else None

    # Rotate Token Pair
    new_access_token = create_access_token(user_id=user_id, tenant_id=tenant_id)
    new_refresh_token = create_refresh_token(user_id=user_id)
    new_refresh_hash = hashlib.sha256(new_refresh_token.encode("utf-8")).hexdigest()

    # Revoke old session and store new session
    await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", (session["id"],))
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    await db.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)",
        (f"sess_{uuid.uuid4().hex[:12]}", user_id, new_refresh_hash, expires_at),
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


# ─── 5. GET /v1/auth/me ────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch the currently authenticated user's profile and active tenant memberships."""
    db = get_db_engine()
    memberships = await db.fetch_all(
        "SELECT tm.role, t.id as tenant_id, t.name, t.type, t.slug, t.plan FROM tenant_memberships tm "
        "JOIN tenants t ON tm.tenant_id = t.id WHERE tm.user_id = ?",
        (user["id"],),
    )

    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user.get("avatar_url"),
            "is_verified": bool(user.get("is_verified")),
            "created_at": user.get("created_at"),
        },
        "tenants": memberships,
    }


# ─── 6. POST /v1/auth/otp/send ─────────────────────────────────────────────────

@router.post("/otp/send")
async def send_otp(body: OtpSendRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Generate and send a 6-digit email verification OTP via SMTP."""
    db = get_db_engine()
    otp_code = generate_otp_code()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    await db.execute(
        "INSERT INTO email_otps (id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
        (f"otp_{uuid.uuid4().hex[:12]}", user["email"], otp_code, body.purpose, expires_at),
    )

    email_service = get_email_service()
    sent = await email_service.send_otp_email(user["email"], otp_code, body.purpose)
    return {"message": f"Verification code sent to {user['email']}", "delivered": sent}


# ─── 7. POST /v1/auth/otp/verify ───────────────────────────────────────────────

@router.post("/otp/verify")
async def verify_otp(body: OtpVerifyRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Verify the 6-digit OTP code to mark the account as verified."""
    db = get_db_engine()
    record = await db.fetch_one(
        "SELECT * FROM email_otps WHERE email = ? AND otp_code = ? AND purpose = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
        (user["email"], body.otp_code, body.purpose),
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used verification code")

    # Mark OTP as used and user as verified
    await db.execute("UPDATE email_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (record["id"],))
    await db.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (user["id"],))

    return {"message": "Account email successfully verified", "is_verified": True}


# ─── 8. POST /v1/auth/forgot-password ──────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Request a password reset OTP sent to the user's email."""
    db = get_db_engine()
    user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (body.email.lower(),))
    if user:
        otp_code = generate_otp_code()
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        await db.execute(
            "INSERT INTO email_otps (id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
            (f"otp_{uuid.uuid4().hex[:12]}", body.email.lower(), otp_code, "password_reset", expires_at),
        )
        email_service = get_email_service()
        await email_service.send_otp_email(body.email.lower(), otp_code, "password_reset")

    # Always return 200 to prevent user enumeration attacks
    return {"message": "If the account exists, a 6-digit password reset code has been sent."}


# ─── 9. POST /v1/auth/reset-password ───────────────────────────────────────────

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset password using the received OTP and new password."""
    db = get_db_engine()
    record = await db.fetch_one(
        "SELECT * FROM email_otps WHERE email = ? AND otp_code = ? AND purpose = 'password_reset' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
        (body.email.lower(), body.otp_code),
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code")

    user = await db.fetch_one("SELECT id FROM users WHERE email = ?", (body.email.lower(),))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    new_hash = hash_password(body.new_password)
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))
    await db.execute("UPDATE email_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (record["id"],))
    # Revoke all active sessions
    await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?", (user["id"],))

    return {"message": "Password successfully reset. You may now login with your new credentials."}


# ─── 10. POST /v1/auth/change-password ─────────────────────────────────────────

@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Change password by providing current and new password while logged in."""
    if not user.get("password_hash") or not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password does not match")

    db = get_db_engine()
    new_hash = hash_password(body.new_password)
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))

    return {"message": "Password successfully updated"}


# ─── 11. GET /v1/auth/{provider}/login ─────────────────────────────────────────

@router.get("/{provider}/login")
async def oauth_login(provider: str):
    """Initiate OAuth login flow (provider: google or github)."""
    provider_lower = provider.lower()
    if provider_lower not in ["google", "github"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider. Use 'google' or 'github'.")

    state = uuid.uuid4().hex
    if provider_lower == "github":
        client_id = os.getenv("GITHUB_CLIENT_ID", "bee_mock_github_client_id")
        auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=user:email&state={state}"
    else:
        client_id = os.getenv("GOOGLE_CLIENT_ID", "bee_mock_google_client_id")
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&response_type=code&scope=openid%20email%20profile&state={state}"

    return {"provider": provider_lower, "authorization_url": auth_url, "state": state}


# ─── 12. GET /v1/auth/{provider}/callback ──────────────────────────────────────

@router.get("/{provider}/callback")
async def oauth_callback(provider: str, code: str, state: Optional[str] = None):
    """Handle OAuth redirect callback, link account, and auto-verify account."""
    provider_lower = provider.lower()
    if provider_lower not in ["google", "github"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider")

    # In production, exchange code for provider tokens. For standard flow:
    mock_email = f"oauth_{code[:6]}@{provider_lower}.com"
    mock_name = f"{provider_lower.capitalize()} User"
    mock_provider_uid = f"{provider_lower}_{code[:8]}"

    db = get_db_engine()
    # Check if OAuth account exists
    oauth_acc = await db.fetch_one(
        "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
        (provider_lower, mock_provider_uid),
    )

    if oauth_acc:
        user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (oauth_acc["user_id"],))
        user_id = user["id"]
    else:
        # Check if email exists
        user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (mock_email,))
        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
            slug = f"{provider_lower}-{uuid.uuid4().hex[:6]}"

            await db.execute(
                "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
                (tenant_id, f"{mock_name}'s Workspace", "personal", slug, "free"),
            )
            await db.execute(
                "INSERT INTO users (id, email, full_name, is_verified) VALUES (?, ?, ?, ?)",
                (user_id, mock_email, mock_name, 1),
            )
            await db.execute(
                "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
                (tenant_id, user_id, "owner"),
            )
        else:
            user_id = user["id"]

        await db.execute(
            "INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)",
            (f"oa_{uuid.uuid4().hex[:12]}", user_id, provider_lower, mock_provider_uid),
        )

    membership = await db.fetch_one("SELECT tenant_id FROM tenant_memberships WHERE user_id = ? LIMIT 1", (user_id,))
    tenant_id = membership["tenant_id"] if membership else None

    access_token = create_access_token(user_id=user_id, tenant_id=tenant_id)
    refresh_token = create_refresh_token(user_id=user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "provider": provider_lower,
        "user_id": user_id,
        "is_verified": True,
    }
