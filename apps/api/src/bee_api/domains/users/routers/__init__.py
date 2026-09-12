"""Users Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.users.routers.profile import router as profile_router
from bee_api.domains.users.routers.update import router as update_router

router = APIRouter()
router.include_router(profile_router)
router.include_router(update_router)
