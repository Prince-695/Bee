"""Multi-Tenant Organization & RBAC Router (/v1/tenants/*)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


class CreateTenantRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    plan: str = Field(default="free", description="'free' | 'starter' | 'pro' | 'enterprise'")


class AddMemberRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    role: str = Field(default="member", description="'admin' | 'member' | 'viewer'")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_tenant(body: CreateTenantRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new Organization tenant with the creator as Owner."""
    db = get_db_engine()
    tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
    slug = body.name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:4]

    await db.execute(
        "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
        (tenant_id, body.name, "organization", slug, body.plan),
    )
    await db.execute(
        "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
        (tenant_id, user["id"], "owner"),
    )

    return {
        "id": tenant_id,
        "name": body.name,
        "type": "organization",
        "slug": slug,
        "plan": body.plan,
        "role": "owner",
    }


@router.get("")
async def list_my_tenants(user: Dict[str, Any] = Depends(get_current_user)):
    """List all tenants (Personal and Organization) the user belongs to."""
    db = get_db_engine()
    memberships = await db.fetch_all(
        "SELECT t.*, tm.role FROM tenants t "
        "JOIN tenant_memberships tm ON t.id = tm.tenant_id "
        "WHERE tm.user_id = ? ORDER BY t.created_at ASC",
        (user["id"],),
    )
    return {"tenants": memberships}


@router.get("/{tenant_id}")
async def get_tenant_details(tenant_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Get tenant details if user is a member."""
    db = get_db_engine()
    membership = await db.fetch_one(
        "SELECT t.*, tm.role FROM tenants t "
        "JOIN tenant_memberships tm ON t.id = tm.tenant_id "
        "WHERE t.id = ? AND tm.user_id = ?",
        (tenant_id, user["id"]),
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant organization not found or access denied")
    return membership


@router.get("/{tenant_id}/members")
async def list_tenant_members(tenant_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """List all members of a tenant."""
    db = get_db_engine()
    # Verify current user is member
    my_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, user["id"]),
    )
    if not my_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    members = await db.fetch_all(
        "SELECT u.id, u.email, u.full_name, u.avatar_url, tm.role, tm.created_at "
        "FROM tenant_memberships tm "
        "JOIN users u ON tm.user_id = u.id "
        "WHERE tm.tenant_id = ? ORDER BY tm.created_at ASC",
        (tenant_id,),
    )
    return {"tenant_id": tenant_id, "members": members}


@router.post("/{tenant_id}/members", status_code=status.HTTP_201_CREATED)
async def add_tenant_member(tenant_id: str, body: AddMemberRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Add a member to the organization (Requires 'admin' or 'owner' role)."""
    db = get_db_engine()
    # Verify current user is admin or owner
    my_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, user["id"]),
    )
    if not my_membership or my_membership["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Owners and Admins can add members")

    target_user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (body.email.lower(),))
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No user registered with email {body.email}")

    existing = await db.fetch_one(
        "SELECT * FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, target_user["id"]),
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this organization")

    await db.execute(
        "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
        (tenant_id, target_user["id"], body.role),
    )

    return {
        "tenant_id": tenant_id,
        "user_id": target_user["id"],
        "email": target_user["email"],
        "role": body.role,
        "message": f"Successfully added {target_user['email']} as {body.role}",
    }


@router.delete("/{tenant_id}/members/{target_user_id}")
async def remove_tenant_member(tenant_id: str, target_user_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Remove a member from the organization (Requires 'admin' or 'owner' role)."""
    db = get_db_engine()
    my_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, user["id"]),
    )
    if not my_membership or my_membership["role"] not in ["owner", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Owners and Admins can remove members")

    target_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, target_user_id),
    )
    if not target_membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in organization")

    if target_membership["role"] == "owner" and my_membership["role"] != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot remove Owners")

    await db.execute(
        "DELETE FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, target_user_id),
    )

    return {"message": "Member successfully removed from organization"}
