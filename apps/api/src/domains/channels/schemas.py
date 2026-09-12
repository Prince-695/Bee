"""Alert Channels Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AlertChannelStatus(BaseModel):
    channel: str
    is_connected: bool
    priority: int


class ChannelsStatusResponse(BaseModel):
    channels: List[AlertChannelStatus]
    primary_channel: Optional[str] = None


class SmartAlertRequest(BaseModel):
    gate_id: str
    title: str = Field(..., min_length=2)
    summary: str = Field(..., min_length=2)
    risk_level: str = Field(default="high", description="'critical' | 'high' | 'medium'")
    arguments: Dict[str, Any] = Field(default_factory=dict)


class SmartAlertResponse(BaseModel):
    gate_id: str
    dispatched_channel: str
    is_escalated: bool = False
    delivery_status: str = "delivered"
    dispatched_at: str


class TwilioVoiceEscalationRequest(BaseModel):
    gate_id: str
    phone_number: str = Field(..., description="E.164 phone number e.g. +14155552671")
    urgency_reason: str = Field(default="Critical Sev-1 gate pending human authorization")
