"""Encrypted Credentials Vault Schemas."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class CredentialStoreRequest(BaseModel):
    platform: str = Field(..., min_length=2, description="Platform identifier e.g. 'github', 'jira', 'slack'")
    credential_key: str = Field(..., min_length=2, description="Key name e.g. 'PERSONAL_ACCESS_TOKEN', 'API_KEY'")
    credential_value: str = Field(..., min_length=1, description="Plaintext secret value to encrypt")
    label: Optional[str] = Field(default="", description="Optional friendly label for display")


class CredentialItem(BaseModel):
    id: str
    platform: str
    credential_key: str
    masked_preview: str
    label: str = ""
    created_at: str


class CredentialListResponse(BaseModel):
    credentials: List[CredentialItem]
    count: int
