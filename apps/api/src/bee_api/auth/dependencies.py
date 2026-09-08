"""FastAPI Authentication and Authorization Dependencies."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, Header, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from bee_core.db.connection import get_db_engine
from bee_api.core.cookies import extract_tokens_from_request, set_auth_cookies
from bee_api.core.security import create_access_token, create_refresh_token, decode_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    response: Response,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """Extract and validate the authenticated user from Bearer header or HttpOnly cookies.
    
    Transparently auto-refreshes 30-minute access tokens if an active 7-day refresh token cookie exists.
    """
    token = credentials.credentials if credentials else None
    cookie_access, cookie_refresh = extract_tokens_from_request(request)
    
    if not token:
        token = cookie_access

    if token:
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                db = get_db_engine()
                user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
                if user:
                    return dict(user)

    # Auto-refresh via 7-day refresh token
    if cookie_refresh:
        refresh_payload = decode_token(cookie_refresh)
        if refresh_payload and refresh_payload.get("type") == "refresh":
            user_id = refresh_payload.get("sub")
            if user_id:
                db = get_db_engine()
                user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
                if user:
                    membership = await db.fetch_one(
                        "SELECT tenant_id FROM tenant_memberships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
                        (user_id,),
                    )
                    tenant_id = membership["tenant_id"] if membership else None
                    new_access = create_access_token(user_id=user_id, tenant_id=tenant_id)
                    new_refresh = create_refresh_token(user_id=user_id)
                    request.state.new_tokens = (new_access, new_refresh)
                    if response:
                        set_auth_cookies(response, new_access, new_refresh)
                        response.headers["X-Access-Token"] = new_access
                    return dict(user)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_tenant(
    user: Dict[str, Any] = Depends(get_current_user),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
) -> Dict[str, Any]:
    """Resolve the active tenant for the request with membership validation."""
    db = get_db_engine()

    if x_tenant_id:
        membership = await db.fetch_one(
            "SELECT tm.*, t.name, t.type, t.slug, t.plan FROM tenant_memberships tm "
            "JOIN tenants t ON tm.tenant_id = t.id WHERE tm.tenant_id = ? AND tm.user_id = ?",
            (x_tenant_id, user["id"]),
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this tenant organization",
            )
        return membership

    # Fallback to user's personal tenant
    membership = await db.fetch_one(
        "SELECT tm.*, t.name, t.type, t.slug, t.plan FROM tenant_memberships tm "
        "JOIN tenants t ON tm.tenant_id = t.id WHERE tm.user_id = ? AND t.type = 'personal' LIMIT 1",
        (user["id"],),
    )
    if not membership:
        # Fallback to any tenant membership
        membership = await db.fetch_one(
            "SELECT tm.*, t.name, t.type, t.slug, t.plan FROM tenant_memberships tm "
            "JOIN tenants t ON tm.tenant_id = t.id WHERE tm.user_id = ? LIMIT 1",
            (user["id"],),
        )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no associated tenant account",
        )

    return membership


def require_role(min_role: str):
    """Enforce minimum RBAC role ('viewer' <= 'member' <= 'admin' <= 'owner')."""
    role_hierarchy = {"viewer": 1, "member": 2, "admin": 3, "owner": 4}

    async def role_checker(tenant: Dict[str, Any] = Depends(get_current_tenant)):
        user_role = tenant.get("role", "viewer")
        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires minimum '{min_role}' role (current role: '{user_role}')",
            )
        return tenant

    return role_checker


require_admin_role = require_role("admin")
require_owner_role = require_role("owner")


def verify_tenant_ownership(resource_tenant_id: str, active_tenant: Dict[str, Any]) -> None:
    """Validate resource boundary to prevent Insecure Direct Object Reference (IDOR)."""
    current_tenant_id = active_tenant.get("tenant_id")
    if not current_tenant_id or resource_tenant_id != current_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Resource does not belong to your active organization",
        )
