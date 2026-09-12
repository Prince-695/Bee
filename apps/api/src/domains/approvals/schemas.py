"""Zero-Trust Human Approval Gates Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GateActionRequest(BaseModel):
    reason: Optional[str] = Field(default=None, description="Optional explanation for decision")


class ApprovalGateItem(BaseModel):
    id: str
    tenant_id: str
    mission_id: Optional[str] = None
    flight_id: Optional[str] = None
    action_type: str
    payload_json: Dict[str, Any] = Field(default_factory=dict)
    status: str
    created_at: str
    resolved_at: Optional[str] = None


class ApprovalGateListResponse(BaseModel):
    gates: List[Dict[str, Any]]
    count: int
