"""MCP Tool Execution Endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.mcp.schemas import McpToolExecuteRequest, McpToolExecuteResponse
from bee_api.domains.mcp.service import McpCatalogService

router = APIRouter(prefix="/v1/mcp", tags=["Model Context Protocol (MCP) Catalog"])


@router.post("/execute", response_model=McpToolExecuteResponse)
async def execute_mcp_tool(
    body: McpToolExecuteRequest,
    tenant: CurrentTenantDep,
) -> McpToolExecuteResponse:
    """Execute a cloud-hosted FastMCP tool in zero-bloat server environment."""
    return await McpCatalogService.execute_tool(
        server_name=body.server_name,
        tool_name=body.tool_name,
        arguments=body.arguments,
    )
