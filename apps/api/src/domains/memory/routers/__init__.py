"""Memory & Context Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.memory.routers.crud import router as crud_router
from bee_api.domains.memory.routers.remediations import router as remediations_router
from bee_api.domains.memory.routers.search import router as search_router
from bee_api.domains.memory.routers.context import router as context_router

router = APIRouter()
router.include_router(crud_router)
router.include_router(remediations_router)
router.include_router(search_router)
router.include_router(context_router)

__all__ = ["router", "crud_router", "remediations_router", "search_router", "context_router"]
