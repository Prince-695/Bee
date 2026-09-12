"""Admin Domain Routers Aggregator."""

from fastapi import APIRouter
from bee_api.domains.admin.routers.security_audit import router as security_audit_router
from bee_api.domains.admin.routers.tenants import router as tenants_router

router = APIRouter()
router.include_router(security_audit_router)
router.include_router(tenants_router)
