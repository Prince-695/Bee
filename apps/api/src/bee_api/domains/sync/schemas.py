"""Sync Engine Schemas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class PushSyncPayload(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    missions: List[Dict[str, Any]] = Field(default_factory=list)
    approvals: List[Dict[str, Any]] = Field(default_factory=list)
