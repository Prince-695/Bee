"""Bee API Core Package.

Exports configuration, security, database pooling, cookies, and dependencies.
"""

from bee_api.core.config import settings
from bee_api.core.cookies import clear_auth_cookies, set_auth_cookies
from bee_api.core.database import check_db_health, close_db_pool, get_db_connection, init_db_pool
from bee_api.core.dependencies import (
    CurrentTenantDep,
    CurrentUserDep,
    get_current_tenant,
    get_current_user,
    require_role,
)
from bee_api.core.encryption import decrypt_secret, encrypt_secret, mask_secret
from bee_api.core.openapi import custom_openapi, setup_protected_docs, validate_swagger_credentials
from bee_api.core.responses import error_response, success_response

__all__ = [
    "settings",
    "init_db_pool",
    "close_db_pool",
    "get_db_connection",
    "check_db_health",
    "encrypt_secret",
    "decrypt_secret",
    "mask_secret",
    "set_auth_cookies",
    "clear_auth_cookies",
    "get_current_user",
    "get_current_tenant",
    "require_role",
    "CurrentUserDep",
    "CurrentTenantDep",
    "validate_swagger_credentials",
    "setup_protected_docs",
    "custom_openapi",
    "success_response",
    "error_response",
]
