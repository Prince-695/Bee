"""Admin and Governance Router for Protected Platform Operations."""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.auth.dependencies import require_admin_role
from bee_core.config import validate_environment, mask_secret, LLM_API_KEY, LLM_MODEL, CORS_ALLOWED_ORIGINS
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/admin", tags=["Admin & Governance"])


@router.get("/health/security", response_model=Dict[str, Any])
async def get_security_health_audit(
    admin_tenant: Dict[str, Any] = Depends(require_admin_role),
) -> Dict[str, Any]:
    """Retrieve security health audit without leaking raw secret values (admin only)."""
    env_status = validate_environment()

    return {
        "status": "healthy" if env_status["healthy"] else "needs_attention",
        "debug_mode": env_status["debug_mode"],
        "issues": env_status["issues"],
        "secrets_audit": {
            "jwt_secret_secure": not env_status["is_insecure_jwt"],
            "llm_api_key_configured": bool(LLM_API_KEY),
            "llm_api_key_masked": mask_secret(LLM_API_KEY),
            "llm_model": LLM_MODEL,
        },
        "cors_policy": {
            "allowed_origins": CORS_ALLOWED_ORIGINS,
            "wildcard_with_credentials_blocked": "*" not in CORS_ALLOWED_ORIGINS,
        },
        "caller_admin_user": admin_tenant.get("user_id"),
        "caller_tenant_id": admin_tenant.get("tenant_id"),
    }


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
