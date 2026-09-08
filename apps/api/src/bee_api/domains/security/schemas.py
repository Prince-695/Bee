"""Security Audit & Redaction Schemas."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class RedactTextRequest(BaseModel):
    text: str


class RecordSpendRequest(BaseModel):
    model: str = "gemini-2.5-flash"
    prompt_tokens: int
    completion_tokens: int
    route_id: Optional[str] = None
    flight_id: Optional[str] = None
