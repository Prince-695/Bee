"""Tenant Creation Endpoint."""

from __future__ import annotations

import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, status

from bee_core.db.connection import get_db_engine
from bee_api.auth.dependencies import get_current_user
from bee_api.domains.tenants.schemas import CreateTenantRequest

router = APIRouter(prefix="/v1/tenants", tags=["Tenants & Multi-Tenancy"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_tenant(
    body: CreateTenantRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new Organization tenant with the creator as Owner."""
    db = get_db_engine()
    tenant_id = f"tenant_{uuid.uuid4().hex[:12]}"
    slug = body.name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:4]

    await db.execute(
        "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
        (tenant_id, body.name, "organization", slug, body.plan),
    )
    await db.execute(
        "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
        (tenant_id, user["id"], "owner"),
    )

    return {
        "id": tenant_id,
        "name": body.name,
        "type": "organization",
        "slug": slug,
        "plan": body.plan,
        "role": "owner",
    }
