"""Agent Execution Schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
