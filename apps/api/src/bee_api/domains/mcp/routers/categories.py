"""MCP Categories Listing Endpoint."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter

from bee_api.domains.mcp.schemas import McpCategoryItem
from bee_api.domains.mcp.service import McpCatalogService

router = APIRouter(prefix="/v1/mcp", tags=["Model Context Protocol (MCP) Catalog"])


@router.get("/categories", response_model=List[McpCategoryItem])
async def list_mcp_categories() -> List[McpCategoryItem]:
    """List tool categories and counts available in the cloud FastMCP catalog."""
    return McpCatalogService.list_categories()
