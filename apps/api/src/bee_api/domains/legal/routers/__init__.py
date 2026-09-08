"""Legal and Cookie Policy Routers Aggregator."""

from __future__ import annotations

from fastapi import APIRouter
from bee_api.domains.legal.routers.cookie_consent import router as consent_router
from bee_api.domains.legal.routers.cookie_policy import router as policy_router

router = APIRouter(prefix="/v1/legal", tags=["Legal & Cookies"])
router.include_router(policy_router)
router.include_router(consent_router)
