"""Model Context Protocol (MCP) Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class McpToolItem(BaseModel):
    id: str
    name: str
    server_name: str
    category: str
    description: str
    parameters_schema: Dict[str, Any] = Field(default_factory=dict)
    is_installed: bool = True
    cloud_hosted: bool = True


class McpCatalogResponse(BaseModel):
    tools: List[McpToolItem]
    total: int
    page: int
    page_size: int
    categories: List[str]


class McpCategoryItem(BaseModel):
    id: str
    name: str
    icon: str
    tool_count: int


class McpServerInfo(BaseModel):
    name: str
    status: str
    transport: str = "cloud_fastmcp"
    tool_count: int
    description: str


class McpToolExecuteRequest(BaseModel):
    server_name: str
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class McpToolExecuteResponse(BaseModel):
    success: bool
    result: Any
    server_name: str
    tool_name: str
    execution_time_ms: int
