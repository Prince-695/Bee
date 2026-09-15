"""Multi-Tenant Organization & RBAC Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateTenantRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    plan: str = Field(default="free", description="'free' | 'starter' | 'pro' | 'enterprise'")


class AddMemberRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    role: str = Field(default="member", description="'admin' | 'member' | 'viewer'")


class TenantItem(BaseModel):
    id: str
    name: str
    type: str = "organization"
    slug: str
    plan: str = "free"
    role: str = "member"


class TenantListResponse(BaseModel):
    tenants: List[Dict[str, Any]]


class MemberListResponse(BaseModel):
    tenant_id: str
    members: List[Dict[str, Any]]


class UpdateMemberRoleRequest(BaseModel):
    role: str = Field(..., description="'admin' | 'member' | 'viewer' | 'guest'")

