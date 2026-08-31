"""Authentication Package for Bee API."""

from bee_api.auth.legacy import (
    PUBLIC_PATH_PREFIXES,
    extract_bearer_token,
    is_public_path,
    resolve_request_user,
)
from bee_api.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
)
from bee_api.auth.dependencies import (
    get_current_user,
    get_current_tenant,
    require_role,
)

__all__ = [
    "PUBLIC_PATH_PREFIXES",
    "extract_bearer_token",
    "is_public_path",
    "resolve_request_user",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "generate_otp_code",
    "get_current_user",
    "get_current_tenant",
    "require_role",
]
