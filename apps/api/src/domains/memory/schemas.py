"""Memory & Knowledge Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Legacy & Remediation Schemas ───

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


# ─── Phase 2 Generalized Memory Schemas ───

class CitationSchema(BaseModel):
    source_id: str
    source_type: str = "mission"
    location: Optional[str] = None
    snippet: Optional[str] = None
    timestamp: Optional[str] = None


class CreateMemoryRequest(BaseModel):
    title: str = Field(..., description="Short descriptive title of the memory")
    content: str = Field(..., description="Full text or structured explanation of the memory")
    type: str = Field(default="semantic", description="'episodic' | 'semantic' | 'working'")
    scope: str = Field(default="project", description="'user' | 'project' | 'organization' | 'worker'")
    project_id: Optional[str] = None
    worker_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    citations: List[CitationSchema] = Field(default_factory=list)


class UpdateMemoryRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class MemoryResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    worker_id: Optional[str] = None
    type: str
    scope: str
    title: str
    content: str
    tags: List[str]
    metadata: Dict[str, Any]
    confidence: float
    citations: List[CitationSchema] = Field(default_factory=list)
    created_at: str
    updated_at: str


class SearchMemoryRequest(BaseModel):
    query: str = Field(..., description="Search query string")
    scope: Optional[str] = None
    type: Optional[str] = None
    project_id: Optional[str] = None
    worker_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=50)
    threshold: float = Field(default=0.1, ge=0.0, le=1.0)


class ScoredMemoryResponse(BaseModel):
    memory: MemoryResponse
    score: float
    vector_score: float = 0.0
    keyword_score: float = 0.0
    citation: Optional[CitationSchema] = None


class CreateLinkRequest(BaseModel):
    source_id: str
    source_type: str
    target_id: str
    target_type: str
    relation: str = "PRODUCED"
    weight: float = 1.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LinkResponse(BaseModel):
    id: str
    tenant_id: str
    source_id: str
    source_type: str
    target_id: str
    target_type: str
    relation: str
    weight: float
    metadata: Dict[str, Any]
    created_at: str


class SynthesizeContextRequest(BaseModel):
    project_id: Optional[str] = None
    git_summary: Optional[str] = None
    browser_permission_granted: bool = False
    signed_in_account: Optional[str] = None
    browser_history: List[Dict[str, Any]] = Field(default_factory=list)
