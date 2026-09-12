"""Memory & Knowledge Schemas."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class SaveRemediationRequest(BaseModel):
    problem_signature: str = Field(..., description="E.g. 'AssertionError: test_oauth_token_refresh'")
    patch_diff: str = Field(..., description="Git unified diff patch")
    error_log: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class SearchCodeRequest(BaseModel):
    project_id: str
    query: str = Field(..., description="Natural language search query")
    top_k: int = Field(default=5, ge=1, le=20)


class IndexCodeRequest(BaseModel):
    project_id: str
    file_path: str
    chunk_content: str
    symbol_name: Optional[str] = None
