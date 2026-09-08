"""Admin Security Audit Health Probe Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import require_admin_role
from bee_api.core.config import settings
from bee_core.config import validate_environment, mask_secret, LLM_API_KEY, LLM_MODEL

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
            "allowed_origins": settings.CORS_ALLOWED_ORIGINS,
            "wildcard_with_credentials_blocked": "*" not in settings.CORS_ALLOWED_ORIGINS,
        },
        "caller_admin_user": admin_tenant.get("user_id"),
        "caller_tenant_id": admin_tenant.get("tenant_id"),
    }
