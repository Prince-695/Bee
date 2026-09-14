"""Global MCP Catalog Search Endpoint."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query

from bee_api.domains.mcp.schemas import McpCatalogResponse
from bee_api.domains.mcp.service import McpCatalogService

router = APIRouter(prefix="/v1/mcp", tags=["Model Context Protocol (MCP) Catalog"])


@router.get("/catalog", response_model=McpCatalogResponse)
async def get_mcp_catalog(
    q: Optional[str] = Query(None, description="Fuzzy search query for tool names or descriptions"),
    category: Optional[str] = Query(None, description="Filter by category slug"),
    scope: Optional[str] = Query(None, description="Filter by tool execution scope (LOCAL | CLOUD | HYBRID)"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> McpCatalogResponse:
    """Browse and fuzzy-search the global catalog of cloud-hosted and hybrid FastMCP tools."""
    return McpCatalogService.search_catalog(
        query=q,
        category=category,
        scope=scope,
        page=page,
        page_size=page_size,
    )
