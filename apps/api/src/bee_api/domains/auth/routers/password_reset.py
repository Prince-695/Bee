"""Password Reset and Management Endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.security import (
    generate_otp_code,
    hash_password,
    verify_password,
)
from bee_api.auth.dependencies import get_current_user
from bee_api.auth.email_service import get_email_service
from bee_api.domains.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest) -> Dict[str, str]:
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


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest) -> Dict[str, str]:
    """Reset password using the received OTP and new password."""
    db = get_db_engine()
    record = await db.fetch_one(
        """
        SELECT * FROM email_otps 
        WHERE email = ? AND otp_code = ? AND purpose = 'password_reset' AND used_at IS NULL 
        ORDER BY created_at DESC LIMIT 1
        """,
        (body.email.lower(), body.otp_code),
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code",
        )

    user = await db.fetch_one("SELECT id FROM users WHERE email = ?", (body.email.lower(),))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    new_hash = hash_password(body.new_password)
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))
    await db.execute("UPDATE email_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (record["id"],))
    await db.execute("UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?", (user["id"],))

    return {"message": "Password successfully reset. You may now login with your new credentials."}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    """Change password by providing current and new password while logged in."""
    if not user.get("password_hash") or not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password does not match")

    db = get_db_engine()
    new_hash = hash_password(body.new_password)
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))

    return {"message": "Password successfully updated"}
