"""Health Probes Router Aggregator."""

from __future__ import annotations

from fastapi import APIRouter
from bee_api.domains.health.routers.live import router as live_router
from bee_api.domains.health.routers.ready import router as ready_router

router = APIRouter(prefix="/health", tags=["Health & Readiness"])
router.include_router(live_router)
router.include_router(ready_router)
