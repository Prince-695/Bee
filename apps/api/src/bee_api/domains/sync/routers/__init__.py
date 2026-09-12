"""Sync Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.sync.routers.push import router as push_router
from bee_api.domains.sync.routers.pull import router as pull_router
from bee_api.domains.sync.routers.status import router as status_router

router = APIRouter()
router.include_router(push_router)
router.include_router(pull_router)
router.include_router(status_router)
