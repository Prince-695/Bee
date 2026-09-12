"""Email OTP Verification Endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.security import generate_otp_code
from bee_api.core.dependencies import get_current_user
from bee_api.core.email import get_email_service
from bee_api.domains.auth.schemas import OtpSendRequest, OtpVerifyRequest

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/otp/send")
async def send_otp(
    body: OtpSendRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
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


@router.post("/otp/verify")
async def verify_otp(
    body: OtpVerifyRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Verify the 6-digit OTP code to mark the account as verified."""
    db = get_db_engine()
    record = await db.fetch_one(
        """
        SELECT * FROM email_otps 
        WHERE email = ? AND otp_code = ? AND purpose = ? AND used_at IS NULL 
        ORDER BY created_at DESC LIMIT 1
        """,
        (user["email"], body.otp_code, body.purpose),
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used verification code",
        )

    await db.execute("UPDATE email_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (record["id"],))
    await db.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (user["id"],))

    return {"message": "Account email successfully verified", "is_verified": True}
