"""Core FastAPI Dependencies: Authentication, Auto-Session Refresh, and RBAC.

Enforces 30-min access tokens and transparent 7-day refresh token rotation.
"""

from __future__ import annotations

from typing import Annotated, Any, Dict, List, Optional
from fastapi import Depends, HTTPException, Request, Response, status

from bee_api.core.cookies import extract_tokens_from_request, set_auth_cookies
from bee_api.core.security import create_access_token, create_refresh_token, decode_token
from bee_core.db.connection import get_db_engine


async def get_current_user(
    request: Request,
    response: Response,
) -> Dict[str, Any]:
    """Resolves authenticated user from Bearer header or HttpOnly cookie.

    Transparently auto-refreshes 30-minute access tokens if a valid 7-day
    refresh token is present in the active session.
    """
    access_token, refresh_token = extract_tokens_from_request(request)

    # 1. Try decoding the access token
    if access_token:
        payload = decode_token(access_token)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                user = await _fetch_user_by_id(user_id)
                if user:
                    user["current_tenant_id"] = payload.get("tenant_id")
                    user["role"] = payload.get("role", "member")
                    return user

    # 2. Transparent Auto-Refresh: check if valid 7-day refresh token exists
    if refresh_token:
        refresh_payload = decode_token(refresh_token)
        if refresh_payload and refresh_payload.get("type") == "refresh":
            user_id = refresh_payload.get("sub")
            if user_id:
                user = await _fetch_user_by_id(user_id)
                if user:
                    # Resolve user's primary or personal tenant
                    tenant_id = user.get("default_tenant_id") or await _fetch_primary_tenant_id(user_id)
                    role = await _fetch_user_role(user_id, tenant_id) if tenant_id else "member"

                    # Mint new 30-min access token and sliding 7-day refresh token
                    new_access = create_access_token(
                        user_id=user_id,
                        tenant_id=tenant_id,
                        role=role,
                        email=user.get("email"),
                    )
                    new_refresh = create_refresh_token(user_id=user_id)

                    # Update cookies on outgoing response
                    request.state.new_tokens = (new_access, new_refresh)
                    if response:
                        set_auth_cookies(response, new_access, new_refresh)
                        response.headers["X-Access-Token"] = new_access

                    user["current_tenant_id"] = tenant_id
                    user["role"] = role
                    return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required or session expired. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def _fetch_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetches user record from database."""
    db = get_db_engine()
    rows = await db.fetch_all(
        "SELECT id, email, password_hash, full_name, is_verified, created_at FROM users WHERE id = ?",
        (user_id,),
    )
    if not rows:
        # Check backwards compatible schema where full_name was name
        rows = await db.fetch_all("SELECT id, email, password_hash, name, created_at FROM users WHERE id = ?", (user_id,))
        if rows:
            r = dict(rows[0])
            r["full_name"] = r.get("name", "")
            return r
        return None
    return dict(rows[0])


async def _fetch_primary_tenant_id(user_id: str) -> Optional[str]:
    """Fetches primary tenant ID for user."""
    db = get_db_engine()
    rows = await db.fetch_all(
        "SELECT tenant_id FROM tenant_memberships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
        (user_id,),
    )
    return rows[0]["tenant_id"] if rows else None


async def _fetch_user_role(user_id: str, tenant_id: str) -> str:
    """Fetches role of user in tenant."""
    db = get_db_engine()
    rows = await db.fetch_all(
        "SELECT role FROM tenant_memberships WHERE user_id = ? AND tenant_id = ?",
        (user_id, tenant_id),
    )
    return rows[0]["role"] if rows else "member"


CurrentUserDep = Annotated[Dict[str, Any], Depends(get_current_user)]


async def get_current_tenant(
    current_user: CurrentUserDep,
) -> Dict[str, Any]:
    """Resolves active tenant organization for the authenticated user."""
    tenant_id = current_user.get("current_tenant_id")
    if not tenant_id:
        tenant_id = await _fetch_primary_tenant_id(current_user["id"])

    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active workspace or organization selected.",
        )

    db = get_db_engine()
    rows = await db.fetch_all("SELECT id, name, type, slug, plan FROM tenants WHERE id = ?", (tenant_id,))
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant organization '{tenant_id}' not found.",
        )
    tenant = dict(rows[0])
    tenant["tenant_id"] = tenant["id"]
    tenant["current_role"] = current_user.get("role", "member")
    tenant["role"] = tenant["current_role"]
    return tenant


CurrentTenantDep = Annotated[Dict[str, Any], Depends(get_current_tenant)]


def require_role(allowed_roles: List[str]):
    """Enforces RBAC role authorization (e.g. ['owner', 'admin'])."""

    async def role_checker(
        current_user: CurrentUserDep,
        tenant: CurrentTenantDep,
    ) -> Dict[str, Any]:
        role = tenant.get("current_role") or tenant.get("role") or current_user.get("role") or "member"
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of roles {allowed_roles}. Your current role is '{role}'.",
            )
        return tenant

    return role_checker


require_admin_role = require_role(["admin", "owner"])
require_owner_role = require_role(["owner"])


def verify_tenant_ownership(resource_tenant_id: str, active_tenant: Dict[str, Any]) -> None:
    """Validate resource boundary to prevent Insecure Direct Object Reference (IDOR)."""
    current_tenant_id = active_tenant.get("tenant_id") or active_tenant.get("id")
    if not current_tenant_id or resource_tenant_id != current_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Resource does not belong to your active organization",
        )


PUBLIC_PATH_PREFIXES = (
    "/health",
    "/api/health",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/agent",
    "/api/conversations",
    "/api/chats",
    "/api/hive",
    "/api/logs",
    "/api/channels",
    "/api/missions",
    "/api/oauth",
    "/api/security",
    "/api/signals",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/webhooks/",
    "/v1/",
    "/static/",
)


def extract_bearer_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    token = request.query_params.get("access_token")
    if token:
        return token.strip()
    return None


def is_public_path(path: str) -> bool:
    if path == "/":
        return True
    for prefix in PUBLIC_PATH_PREFIXES:
        if path == prefix or path.startswith(prefix):
            return True
    return False


def resolve_request_user(request: Request) -> dict | None:
    token = extract_bearer_token(request)
    if not token:
        return None
    from bee_core.stores.user_store import get_user_for_token
    return get_user_for_token(token)


async def get_runtime_auth(request: Request) -> Dict[str, Any]:
    """Authenticates a local workstation runtime using X-Runtime-Key or Bearer bee_rt_..."""
    runtime_key = request.headers.get("X-Runtime-Key") or ""
    if not runtime_key:
        auth_hdr = request.headers.get("Authorization") or ""
        if auth_hdr.lower().startswith("bearer bee_rt_"):
            runtime_key = auth_hdr[7:].strip()

    if not runtime_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing runtime authentication key (X-Runtime-Key or Bearer bee_rt_...)",
        )

    from services.data.repositories.runtime_repo import RuntimeRepository
    repo = RuntimeRepository()
    runtime = await repo.verify_pairing_key(runtime_key)
    if not runtime:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked runtime pairing key",
        )
    return runtime


