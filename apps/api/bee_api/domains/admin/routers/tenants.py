"""Admin Tenant Management Router."""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import require_admin_role
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/admin", tags=["Admin & Governance"])


@router.get("/tenants", response_model=List[Dict[str, Any]])
async def list_all_tenants(
    admin_tenant: Dict[str, Any] = Depends(require_admin_role),
) -> List[Dict[str, Any]]:
    """List all tenant organizations in the platform (admin only)."""
    db = get_db_engine()
    tenants = await db.fetch_all("SELECT id, name, slug, type, plan, created_at FROM tenants ORDER BY created_at DESC")
    return tenants


@router.post("/tenants/{tenant_id}/suspend")
async def suspend_tenant(
    tenant_id: str,
    admin_tenant: Dict[str, Any] = Depends(require_admin_role),
) -> Dict[str, Any]:
    """Suspend a tenant organization (admin only)."""
    db = get_db_engine()
    tenant = await db.fetch_one("SELECT * FROM tenants WHERE id = ?", (tenant_id,))
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    await db.execute("UPDATE tenants SET plan = 'suspended' WHERE id = ?", (tenant_id,))
    return {"message": f"Tenant {tenant_id} has been suspended", "tenant_id": tenant_id, "status": "suspended"}


@router.post("/tenants/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: str,
    admin_tenant: Dict[str, Any] = Depends(require_admin_role),
) -> Dict[str, Any]:
    """Reactivate a suspended tenant organization (admin only)."""
    db = get_db_engine()
    tenant = await db.fetch_one("SELECT * FROM tenants WHERE id = ?", (tenant_id,))
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    await db.execute("UPDATE tenants SET plan = 'free' WHERE id = ?", (tenant_id,))
    return {"message": f"Tenant {tenant_id} has been activated", "tenant_id": tenant_id, "status": "active"}
