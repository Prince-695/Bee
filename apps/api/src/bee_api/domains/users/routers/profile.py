"""Get Authenticated User Profile Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_user

router = APIRouter(prefix="/v1/users", tags=["Users & Profiles"])


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
