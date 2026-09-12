"""OAuth Authentication Endpoints."""

from __future__ import annotations

import os
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Response, status

from bee_core.db.connection import get_db_engine
from bee_api.core.cookies import set_auth_cookies
from bee_api.core.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/v1/auth", tags=["Authentication & Identity"])


@router.get("/{provider}/login")
async def oauth_login(provider: str) -> Dict[str, str]:
    """Initiate OAuth login flow (provider: google or github)."""
    provider_lower = provider.lower()
    if provider_lower not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported provider. Use 'google' or 'github'.",
        )

    state = uuid.uuid4().hex
    if provider_lower == "github":
        client_id = os.getenv("GITHUB_CLIENT_ID", "bee_mock_github_client_id")
        auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=user:email&state={state}"
    else:
        client_id = os.getenv("GOOGLE_CLIENT_ID", "bee_mock_google_client_id")
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&response_type=code&scope=openid%20email%20profile&state={state}"

    return {"provider": provider_lower, "authorization_url": auth_url, "state": state}


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    response: Response,
    state: Optional[str] = None,
) -> Dict[str, Any]:
    """Handle OAuth redirect callback, link account, set cookies, and return tokens."""
    provider_lower = provider.lower()
    if provider_lower not in ["google", "github"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported provider")

    mock_email = f"oauth_{code[:6]}@{provider_lower}.com"
    mock_name = f"{provider_lower.capitalize()} User"
    mock_provider_uid = f"{provider_lower}_{code[:8]}"

    db = get_db_engine()
    oauth_acc = await db.fetch_one(
        "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
        (provider_lower, mock_provider_uid),
    )

    if oauth_acc:
        user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (oauth_acc["user_id"],))
        user_id = user["id"]
    else:
        user = await db.fetch_one("SELECT * FROM users WHERE email = ?", (mock_email,))
        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
            slug = f"{provider_lower}-{uuid.uuid4().hex[:6]}"

            await db.execute(
                "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
                (tenant_id, f"{mock_name}'s Workspace", "personal", slug, "free"),
            )
            await db.execute(
                "INSERT INTO users (id, email, full_name, is_verified) VALUES (?, ?, ?, ?)",
                (user_id, mock_email, mock_name, 1),
            )
            await db.execute(
                "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
                (tenant_id, user_id, "owner"),
            )
        else:
            user_id = user["id"]

        await db.execute(
            "INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)",
            (f"oa_{uuid.uuid4().hex[:12]}", user_id, provider_lower, mock_provider_uid),
        )

    membership = await db.fetch_one("SELECT tenant_id FROM tenant_memberships WHERE user_id = ? LIMIT 1", (user_id,))
    tenant_id = membership["tenant_id"] if membership else None

    access_token = create_access_token(user_id=user_id, tenant_id=tenant_id)
    refresh_token = create_refresh_token(user_id=user_id)

    # Set HttpOnly Cookies
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "provider": provider_lower,
        "user_id": user_id,
        "is_verified": True,
    }
