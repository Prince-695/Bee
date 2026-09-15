"""Runtimes Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.runtimes.routers.register import router as register_router
from bee_api.domains.runtimes.routers.heartbeat import router as heartbeat_router
from bee_api.domains.runtimes.routers.list_runtimes import router as list_router
from bee_api.domains.runtimes.routers.status import router as status_router
from bee_api.domains.runtimes.routers.revoke import router as revoke_router

router = APIRouter()
router.include_router(register_router)
router.include_router(heartbeat_router)
router.include_router(list_router)
router.include_router(status_router)
router.include_router(revoke_router)
