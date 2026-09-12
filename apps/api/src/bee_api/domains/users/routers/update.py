"""Update Authenticated User Profile Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_user
from bee_api.domains.users.schemas import UpdateProfileRequest
from bee_core.db.connection import get_db_engine

router = APIRouter(prefix="/v1/users", tags=["Users & Profiles"])


@router.put("/me")
async def update_my_profile(body: UpdateProfileRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """Update authenticated user profile."""
    db = get_db_engine()
    full_name = body.full_name or user["full_name"]
    avatar_url = body.avatar_url if body.avatar_url is not None else user.get("avatar_url")

    await db.execute(
        "UPDATE users SET full_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (full_name, avatar_url, user["id"]),
    )

    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": full_name,
        "avatar_url": avatar_url,
        "is_verified": bool(user.get("is_verified")),
    }
