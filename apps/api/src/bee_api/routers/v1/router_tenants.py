"""Multi-Tenant Organization & RBAC Router (/v1/tenants/*).

Compatibility shim re-exporting modular domain router.
"""

from __future__ import annotations

from bee_api.domains.tenants.schemas import (
    CreateTenantRequest,
    AddMemberRequest,
    TenantItem,
    TenantListResponse,
    MemberListResponse,
)
from bee_api.domains.tenants.routers import router

__all__ = [
    "router",
    "CreateTenantRequest",
    "AddMemberRequest",
    "TenantItem",
    "TenantListResponse",
    "MemberListResponse",
]
