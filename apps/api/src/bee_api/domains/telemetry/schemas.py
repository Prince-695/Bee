"""Telemetry & Frontend Logging Schemas."""

from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class FrontendLogRequest(BaseModel):
    event: str = Field(..., min_length=1, max_length=120)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None
