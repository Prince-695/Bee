"""Health Probes Router Aggregator."""

from __future__ import annotations

from fastapi import APIRouter
from bee_api.domains.health.routers.live import router as live_router
from bee_api.domains.health.routers.ready import router as ready_router
from bee_api.domains.health.routers.api_health import router as api_health_router

router = APIRouter(tags=["Health & Readiness"])
router.include_router(live_router, prefix="/health")
router.include_router(ready_router, prefix="/health")
router.include_router(api_health_router)

