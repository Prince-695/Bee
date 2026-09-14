"""Tenant Members Listing Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import get_current_user
from bee_api.domains.tenants.schemas import MemberListResponse, UpdateMemberRoleRequest

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.get("/{tenant_id}/members", response_model=MemberListResponse)
async def list_tenant_members(
    tenant_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> MemberListResponse:
    """List all members of a tenant."""
    db = get_db_engine()
    my_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, user["id"]),
    )
    if not my_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    members = await db.fetch_all(
        """
        SELECT u.id, u.email, u.full_name, u.avatar_url, tm.role, tm.created_at 
        FROM tenant_memberships tm 
        JOIN users u ON tm.user_id = u.id 
        WHERE tm.tenant_id = ? ORDER BY tm.created_at ASC
        """,
        (tenant_id,),
    )
    return MemberListResponse(
        tenant_id=tenant_id,
        members=[dict(m) for m in members],
    )


@router.put("/{tenant_id}/members/{target_user_id}")
async def update_member_role(
    tenant_id: str,
    target_user_id: str,
    body: UpdateMemberRoleRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update role for a member of the tenant organization (owner or admin only)."""
    db = get_db_engine()
    my_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, user["id"]),
    )
    if not my_membership or my_membership["role"] not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can modify member roles",
        )

    target_membership = await db.fetch_one(
        "SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
        (tenant_id, target_user_id),
    )
    if not target_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in organization",
        )

    if target_membership["role"] == "owner" and my_membership["role"] != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an owner can modify another owner's role",
        )

    await db.execute(
        "UPDATE tenant_memberships SET role = ? WHERE tenant_id = ? AND user_id = ?",
        (body.role.lower(), tenant_id, target_user_id),
    )

    return {
        "success": True,
        "tenant_id": tenant_id,
        "user_id": target_user_id,
        "role": body.role.lower(),
        "message": f"Updated role to '{body.role.lower()}'",
    }

