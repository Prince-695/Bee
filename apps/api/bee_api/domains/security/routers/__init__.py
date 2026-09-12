"""Security Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.security.routers.audit import router as audit_router

router = APIRouter()
router.include_router(audit_router)
