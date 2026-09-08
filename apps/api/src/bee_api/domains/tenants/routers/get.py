"""Tenant Retrieval Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.get("/{tenant_id}")
async def get_tenant_details(
    tenant_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get tenant details if user is an active member."""
    db = get_db_engine()
    membership = await db.fetch_one(
        """
        SELECT t.*, tm.role FROM tenants t 
        JOIN tenant_memberships tm ON t.id = tm.tenant_id 
        WHERE t.id = ? AND tm.user_id = ?
        """,
        (tenant_id, user["id"]),
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant organization not found or access denied",
        )
    return dict(membership)
