"""Generalized Memory & Context Graph Data Models for Bee Platform."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MemoryType(str, Enum):
    """The functional tier of memory."""
    EPISODIC = "episodic"  # Past runs, tool outputs, failure traces, verified fixes
    SEMANTIC = "semantic"  # Facts, guidelines, user preferences, architecture standards
    WORKING = "working"    # Active task context, scratchpads, live blackboard states


class MemoryScope(str, Enum):
    """The boundary / tenancy domain of memory visibility."""
    USER = "user"
    PROJECT = "project"
    ORGANIZATION = "organization"
    WORKER = "worker"


class LinkRelation(str, Enum):
    """Relationship semantics between context graph entities."""
    EXECUTED = "EXECUTED"
    PRODUCED = "PRODUCED"
    RESOLVED = "RESOLVED"
    DEPENDS_ON = "DEPENDS_ON"
    PREFERS = "PREFERS"
    MENTIONS = "MENTIONS"
    BELONGS_TO = "BELONGS_TO"


class Citation(BaseModel):
    """Origin provenance linking memory back to source evidence."""
    source_id: str
    source_type: str = "mission"  # "mission", "file", "chat", "task", "git", "web"
    location: Optional[str] = None  # e.g., "src/auth.py:42" or "commit:91a718a"
    snippet: Optional[str] = None
    timestamp: str = Field(default_factory=_utc_now_iso)


class MemoryRecord(BaseModel):
    """Core memory item stored across the 3 tiers."""
    id: str = Field(default_factory=lambda: f"mem-{uuid.uuid4().hex[:12]}")
    tenant_id: str = "default"
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    worker_id: Optional[str] = None
    type: MemoryType = MemoryType.SEMANTIC
    scope: MemoryScope = MemoryScope.PROJECT
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    embedding: Optional[List[float]] = None
    citations: List[Citation] = Field(default_factory=list)
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)


class MemoryLink(BaseModel):
    """Directed edge in the Context Graph linking two entities."""
    id: str = Field(default_factory=lambda: f"link-{uuid.uuid4().hex[:10]}")
    tenant_id: str = "default"
    source_id: str
    source_type: str  # "user", "project", "worker", "task", "mission", "artifact", "memory"
    target_id: str
    target_type: str
    relation: LinkRelation = LinkRelation.PRODUCED
    weight: float = Field(default=1.0, ge=0.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_utc_now_iso)


class EpisodicRemediation(BaseModel):
    """Verified error-fix pair for autonomous self-healing."""
    id: str = Field(default_factory=lambda: f"rem-{uuid.uuid4().hex[:10]}")
    tenant_id: str = "default"
    problem_signature: str
    error_log: Optional[str] = None
    patch_diff: str
    verified_by_worker_id: Optional[str] = None
    success_count: int = 1
    tags: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)


class ScoredMemory(BaseModel):
    """Memory item with retrieval scoring and provenance citation."""
    memory: MemoryRecord
    score: float
    vector_score: float = 0.0
    keyword_score: float = 0.0
    citation: Optional[Citation] = None
