"""V1 API Routers."""

from bee_api.routers.v1.router_auth import router as auth_router
from bee_api.routers.v1.router_users import router as users_router
from bee_api.routers.v1.router_tenants import router as tenants_router
from bee_api.routers.v1.router_missions import router as missions_router
from bee_api.routers.v1.router_approvals import router as approvals_router
from bee_api.routers.v1.router_memory import router as memory_router
from bee_api.routers.v1.router_usage import router as usage_router
from bee_api.routers.v1.router_runtimes import router as runtimes_router

__all__ = [
    "auth_router",
    "users_router",
    "tenants_router",
    "missions_router",
    "approvals_router",
    "memory_router",
    "usage_router",
    "runtimes_router",
]
