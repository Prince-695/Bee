"""Schemas for OAuth Connectors domain."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ConnectorConnectRequest(BaseModel):
    provider: str
    access_token: str
    refresh_token: Optional[str] = None
    scopes: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ConnectorResponse(BaseModel):
    user_id: str
    provider: str
    scopes: List[str]
    metadata: Dict[str, Any]
    connected_at: str
    updated_at: str


class ProviderInfo(BaseModel):
    id: str
    name: str
    category: str
    icon: str
    auth_type: str
    configured: bool
    authorize_url: str
