"""V1 API Routers."""

from bee_api.routers.v1.router_auth import router as auth_router
from bee_api.routers.v1.router_users import router as users_router
from bee_api.routers.v1.router_tenants import router as tenants_router

__all__ = ["auth_router", "users_router", "tenants_router"]
