from __future__ import annotations

from fastapi import Request

from bee_core.stores.user_store import get_user_for_token


PUBLIC_PATH_PREFIXES = (
    "/api/health",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/channels",
    "/api/missions",
    "/api/oauth",
    "/api/signals",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/webhooks/",
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
    return get_user_for_token(token)
