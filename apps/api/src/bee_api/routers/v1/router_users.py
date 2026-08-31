"""User Profile & Settings Router (/v1/users/*)."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user

router = APIRouter(prefix="/v1/users", tags=["Users & Profiles"])


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2)
    avatar_url: Optional[str] = None


@router.get("/me")
async def get_my_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Get authenticated user profile."""
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "avatar_url": user.get("avatar_url"),
        "is_verified": bool(user.get("is_verified")),
        "created_at": user.get("created_at"),
    }


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
