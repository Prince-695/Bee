"""Usage Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.usage.routers.spend import router as spend_router
from bee_api.domains.usage.routers.records import router as records_router

router = APIRouter()
router.include_router(spend_router)
router.include_router(records_router)
