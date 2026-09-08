"""Add Tenant Member Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user
from bee_api.domains.tenants.schemas import AddMemberRequest

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.post("/{tenant_id}/members", status_code=status.HTTP_201_CREATED)
async def add_tenant_member(
    tenant_id: str,
    body: AddMemberRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Add a member to the organization (Requires 'admin' or 'owner' role)."""
    db = get_db_engine()
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
