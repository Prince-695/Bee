"""Memory Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.memory.routers.remediations import router as remediations_router
from bee_api.domains.memory.routers.search import router as search_router

router = APIRouter()
router.include_router(remediations_router)
router.include_router(search_router)
