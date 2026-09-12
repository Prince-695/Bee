"""MCP Active Servers Endpoint."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter

from bee_api.domains.mcp.schemas import McpServerInfo
from bee_api.domains.mcp.service import McpCatalogService

router = APIRouter(prefix="/v1/mcp", tags=["Model Context Protocol (MCP) Catalog"])


@router.get("/servers", response_model=List[McpServerInfo])
async def list_active_mcp_servers() -> List[McpServerInfo]:
    """List active cloud-hosted FastMCP servers and transport states."""
    return McpCatalogService.list_active_servers()
