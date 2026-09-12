"""Health Probe Request and Response Schemas."""

from __future__ import annotations

from typing import Dict
from pydantic import BaseModel, Field


class HealthLiveResponse(BaseModel):
    status: str = Field(default="ok")
    service: str = Field(default="bee-api")
    version: str = Field(default="1.0.0")


class HealthReadyResponse(BaseModel):
    status: str = Field(default="ready")
    database: bool
    components: Dict[str, bool] = Field(default_factory=dict)
