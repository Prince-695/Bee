"""Tenant Members Listing Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import get_current_user
from bee_api.domains.tenants.schemas import MemberListResponse

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
