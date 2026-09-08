"""User Profile Schemas."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2)
    avatar_url: Optional[str] = None
