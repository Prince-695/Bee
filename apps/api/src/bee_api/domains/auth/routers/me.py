"""Authenticated User Profile Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends

from bee_core.db.connection import get_db_engine
from bee_api.core.dependencies import get_current_user
from bee_api.domains.auth.schemas import MeResponse

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.get("/me", response_model=MeResponse)
async def get_me(user: Dict[str, Any] = Depends(get_current_user)) -> MeResponse:
    """Fetch the currently authenticated user's profile and active tenant memberships."""
    db = get_db_engine()
    memberships = await db.fetch_all(
        """
        SELECT tm.role, t.id as tenant_id, t.name, t.type, t.slug, t.plan 
        FROM tenant_memberships tm 
        JOIN tenants t ON tm.tenant_id = t.id 
        WHERE tm.user_id = ?
        """,
        (user["id"],),
    )

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name") or "",
        "avatar_url": user.get("avatar_url"),
        "is_verified": bool(user.get("is_verified")),
        "created_at": str(user.get("created_at") or ""),
    }

    return MeResponse(
        user=user_data,
        tenants=[dict(m) for m in memberships],
    )
