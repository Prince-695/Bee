"""Tenant Listing Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user
from bee_api.domains.tenants.schemas import TenantListResponse

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.get("", response_model=TenantListResponse)
async def list_my_tenants(user: Dict[str, Any] = Depends(get_current_user)) -> TenantListResponse:
    """List all tenants (Personal and Organization) the user belongs to."""
    db = get_db_engine()
    memberships = await db.fetch_all(
        """
        SELECT t.*, tm.role FROM tenants t 
        JOIN tenant_memberships tm ON t.id = tm.tenant_id 
        WHERE tm.user_id = ? ORDER BY t.created_at ASC
        """,
        (user["id"],),
    )
    return TenantListResponse(tenants=[dict(m) for m in memberships])
