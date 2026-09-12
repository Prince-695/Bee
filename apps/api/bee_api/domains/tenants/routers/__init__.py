"""Tenants Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.tenants.routers import (
    create,
    list_tenants,
    get,
    members,
    add_member,
    remove_member,
)

router = APIRouter()
router.include_router(create.router)
router.include_router(list_tenants.router)
router.include_router(get.router)
router.include_router(members.router)
router.include_router(add_member.router)
router.include_router(remove_member.router)
