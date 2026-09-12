"""Billing Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.billing.routers.checkout import router as checkout_router
from bee_api.domains.billing.routers.portal import router as portal_router
from bee_api.domains.billing.routers.subscription import router as subscription_router
from bee_api.domains.billing.routers.webhook import router as webhook_router

router = APIRouter()
router.include_router(checkout_router)
router.include_router(portal_router)
router.include_router(subscription_router)
router.include_router(webhook_router)
