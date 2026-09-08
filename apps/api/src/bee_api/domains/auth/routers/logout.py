"""User Logout Endpoint."""

from __future__ import annotations

import hashlib
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Response

from bee_core.db.connection import get_db_engine
from bee_api.core.cookies import clear_auth_cookies
from bee_api.auth.dependencies import get_current_user
from bee_api.domains.auth.schemas import RefreshRequest

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.post("/logout")
async def logout(
    response: Response,
    body: Optional[RefreshRequest] = None,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    """Invalidate current user session and wipe authentication cookies."""
    db = get_db_engine()
    if body and body.refresh_token:
        refresh_hash = hashlib.sha256(body.refresh_token.encode("utf-8")).hexdigest()
        await db.execute(
            "UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE refresh_token_hash = ?",
            (refresh_hash,),
        )
    else:
        await db.execute(
            "UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL",
            (user["id"],),
        )

    # Wipe HttpOnly cookies
    clear_auth_cookies(response)

    return {"message": "Successfully logged out and revoked active session"}
