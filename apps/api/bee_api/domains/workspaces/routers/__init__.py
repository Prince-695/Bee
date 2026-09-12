"""Workspaces Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.workspaces.routers import (
    connect,
    list_workspaces,
    get,
    branches,
    components,
    sync,
)

router = APIRouter()
router.include_router(connect.router)
router.include_router(list_workspaces.router)
router.include_router(get.router)
router.include_router(branches.router)
router.include_router(components.router)
router.include_router(sync.router)
