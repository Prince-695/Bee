"""Telemetry Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.telemetry.routers.logs import router as logs_router

router = APIRouter()
router.include_router(logs_router)
