"""Authentication Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SignUpRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$", description="Valid email address")
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2)


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = Field(default=None, description="Optional refresh token if not provided via cookies")


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


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_verified: bool
    created_at: Optional[str] = None


class TenantItem(BaseModel):
    id: Optional[str]
    name: Optional[str]
    type: Optional[str] = "personal"
    role: Optional[str] = "owner"
    slug: Optional[str] = None
    plan: Optional[str] = "free"


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    tenant: Dict[str, Any]


class MeResponse(BaseModel):
    user: Dict[str, Any]
    tenants: List[Dict[str, Any]]
