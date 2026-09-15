"""MCP Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.mcp.routers import (
    catalog,
    categories,
    servers,
    execute,
    integrations,
)

router = APIRouter()
router.include_router(catalog.router)
router.include_router(categories.router)
router.include_router(servers.router)
router.include_router(execute.router)
router.include_router(integrations.router)

