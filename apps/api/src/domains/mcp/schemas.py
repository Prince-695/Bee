"""Model Context Protocol (MCP) Domain Schemas."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ToolExecutionScope(str, Enum):
    LOCAL = "LOCAL"      # Requires workstation runtime access (filesystem, shell, local git, docker)
    CLOUD = "CLOUD"      # Serverless cloud execution (web search, SaaS APIs, FastMCP)
    HYBRID = "HYBRID"    # Prefers local if workstation connected, falls back to cloud


class McpToolItem(BaseModel):
    id: str
    name: str
    server_name: str
    category: str
    description: str
    parameters_schema: Dict[str, Any] = Field(default_factory=dict)
    is_installed: bool = True
    cloud_hosted: bool = True
    execution_scope: ToolExecutionScope = ToolExecutionScope.CLOUD
    requires_credentials: bool = False
    credential_platform: Optional[str] = None
    risk_level: str = Field(default="low", description="'low' | 'medium' | 'high'")
    requires_approval: bool = False
    required_capabilities: List[str] = Field(default_factory=list)


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
    execution_scope: ToolExecutionScope = ToolExecutionScope.CLOUD


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
    execution_scope: ToolExecutionScope = ToolExecutionScope.CLOUD
    dispatched_runtime_id: Optional[str] = None
