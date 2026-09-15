"""Security Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.security.routers.audit import router as audit_router
from bee_api.domains.security.routers.security_logs import router as security_logs_router

router = APIRouter()
router.include_router(audit_router)
router.include_router(security_logs_router)
