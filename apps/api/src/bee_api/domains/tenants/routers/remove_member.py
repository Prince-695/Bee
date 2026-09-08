"""Remove Tenant Member Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.delete("/{tenant_id}/members/{target_user_id}")
async def remove_tenant_member(
    tenant_id: str,
    target_user_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
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
