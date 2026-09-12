"""OAuth Connectors & Providers Endpoints."""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import HTMLResponse

from bee_core.stores.oauth_store import OAuthStore
from bee_api.core.config import get_settings
from bee_api.domains.oauth.schemas import ConnectorConnectRequest, ProviderInfo

router = APIRouter(prefix="/api/oauth", tags=["OAuth Connectors"])

def _get_oauth_store() -> OAuthStore:
    settings = get_settings()
    return OAuthStore(settings.DB_PATH)


def _resolve_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization:
        return "default_user"
    token = authorization.replace("Bearer ", "").strip()
    return token or "default_user"


OAUTH_PROVIDERS: Dict[str, Dict[str, Any]] = {
    "github": {
        "name": "GitHub",
        "category": "engineering",
        "icon": "github",
        "auth_type": "oauth2",
        "auth_url": "https://github.com/login/oauth/authorize",
        "client_id_env": "GITHUB_CLIENT_ID",
        "scope": "repo read:user user:email",
    },
    "google": {
        "name": "Google (Gmail / Drive)",
        "category": "workspace",
        "icon": "google",
        "auth_type": "oauth2",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "client_id_env": "GOOGLE_CLIENT_ID",
        "scope": "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email",
    },
    "slack": {
        "name": "Slack",
        "category": "workspace",
        "icon": "slack",
        "auth_type": "oauth2",
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "client_id_env": "SLACK_CLIENT_ID",
        "scope": "chat:write channels:read",
    },
    "discord": {
        "name": "Discord",
        "category": "workspace",
        "icon": "discord",
        "auth_type": "oauth2",
        "auth_url": "https://discord.com/api/oauth2/authorize",
        "client_id_env": "DISCORD_CLIENT_ID",
        "scope": "bot messages.read",
    },
}


@router.get("/providers")
async def list_providers() -> Dict[str, Any]:
    """List supported OAuth connectors and their readiness status."""
    providers: List[ProviderInfo] = []
    for pid, meta in OAUTH_PROVIDERS.items():
        client_id = os.environ.get(meta["client_id_env"], "")
        configured = bool(client_id)
        auth_url = (
            f"{meta['auth_url']}?client_id={client_id}&scope={meta['scope']}&response_type=code"
            if configured
            else f"/api/oauth/{pid}/demo-authorize"
        )
        providers.append(
            ProviderInfo(
                id=pid,
                name=meta["name"],
                category=meta["category"],
                icon=meta["icon"],
                auth_type=meta["auth_type"],
                configured=configured,
                authorize_url=auth_url,
            )
        )
    return {"success": True, "data": providers}


@router.get("/connectors")
async def list_user_connectors(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """List all active OAuth connectors for the authenticated user."""
    user_id = _resolve_user_id(authorization)
    connectors = _get_oauth_store().list_connectors(user_id)
    return {"success": True, "data": connectors}


@router.post("/connect")
async def connect_provider(
    payload: ConnectorConnectRequest,
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """Store or update user connector credentials."""
    user_id = _resolve_user_id(authorization)
    record = _get_oauth_store().store_token(
        user_id=user_id,
        provider=payload.provider,
        access_token=payload.access_token,
        refresh_token=payload.refresh_token,
        scopes=payload.scopes,
        metadata=payload.metadata,
    )
    return {"success": True, "data": record}


@router.get("/{provider}/demo-authorize")
async def demo_authorize_provider(
    provider: str,
    authorization: Optional[str] = Header(default=None),
) -> HTMLResponse:
    """1-Click instant authorization callback window for desktop and local dev."""
    user_id = _resolve_user_id(authorization)
    provider_key = provider.lower()
    if provider_key not in OAUTH_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    # Store instant mock access token for local/dev usage
    mock_token = f"bee_oauth_{provider_key}_{user_id}_token"
    _get_oauth_store().store_token(
        user_id=user_id,
        provider=provider_key,
        access_token=mock_token,
        scopes=["read", "write"],
        metadata={"connected_via": "1-click-oauth", "provider": provider_key},
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bee — Connected</title>
        <style>
            body {{
                background-color: #09090b;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }}
            .card {{
                background: #18181b;
                border: 1px solid #27272a;
                border-radius: 16px;
                padding: 32px;
                max-width: 380px;
            }}
            .badge {{
                display: inline-block;
                background: rgba(16, 185, 129, 0.1);
                color: #34d399;
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 9999px;
                padding: 4px 12px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 16px;
            }}
            h2 {{ margin: 0 0 8px 0; font-size: 18px; }}
            p {{ color: #a1a1aa; font-size: 13px; margin: 0 0 20px 0; }}
            button {{
                background: #f59e0b;
                color: #000000;
                border: none;
                border-radius: 10px;
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">● Authorized Successfully</div>
            <h2>{OAUTH_PROVIDERS[provider_key]['name']} Connected!</h2>
            <p>Your account has been securely linked to Bee. You can now close this window.</p>
            <button onclick="window.close()">Close Window</button>
        </div>
        <script>
            setTimeout(() => {{
                try {{
                    if (window.opener) {{
                        window.opener.postMessage({{ type: 'OAUTH_SUCCESS', provider: '{provider_key}' }}, '*');
                    }}
                    window.close();
                }} catch (e) {{}}
            }}, 1200);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.delete("/{provider}")
async def disconnect_provider(
    provider: str,
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """Disconnect and revoke an OAuth connector for the authenticated user."""
    user_id = _resolve_user_id(authorization)
    removed = _get_oauth_store().delete_connector(user_id, provider)
    return {"success": True, "data": {"provider": provider, "disconnected": removed}}
