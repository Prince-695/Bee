"""Authentication and Identity Router (/v1/auth/*).

Compatibility shim re-exporting granular domain routers.
"""

from __future__ import annotations

from bee_api.domains.auth.schemas import (
    SignUpRequest,
    LoginRequest,
    RefreshRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    AuthResponse,
    MeResponse,
)
from bee_api.domains.auth.routers import router

__all__ = [
    "router",
    "SignUpRequest",
    "LoginRequest",
    "RefreshRequest",
    "OtpSendRequest",
    "OtpVerifyRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "ChangePasswordRequest",
    "AuthResponse",
    "MeResponse",
]
