"""Runtimes Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.runtimes.routers.register import router as register_router
from bee_api.domains.runtimes.routers.heartbeat import router as heartbeat_router

router = APIRouter()
router.include_router(register_router)
router.include_router(heartbeat_router)
