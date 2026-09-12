"""Channels Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.channels.routers.status import router as status_router
from bee_api.domains.channels.routers.dispatch import router as dispatch_router
from bee_api.domains.channels.routers.voice_emergency import router as voice_router
from bee_api.domains.channels.routers.whatsapp import router as whatsapp_router
from bee_api.domains.channels.routers.webhooks import router as webhooks_router

router = APIRouter()
router.include_router(status_router)
router.include_router(dispatch_router)
router.include_router(voice_router)
router.include_router(whatsapp_router)
router.include_router(webhooks_router)
