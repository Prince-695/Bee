"""Chat Domain Request & Response Schemas for FastAPI."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatThreadCreateRequest(BaseModel):
    """Payload to create a new Universal or 1:1 Worker chat thread."""
    worker_id: Optional[str] = Field(default=None, description="Worker UUID for 1:1 chat, or null for Universal Orchestrator")
    project_id: Optional[str] = Field(default=None, description="Optional associated project UUID")
    title: Optional[str] = Field(default=None, description="Optional custom title for the chat thread")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatThreadResponse(BaseModel):
    """Chat thread summary response."""
    id: str
    tenant_id: str
    user_id: str
    project_id: Optional[str] = None
    worker_id: Optional[str] = None
    title: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str


class ChatMessageSendRequest(BaseModel):
    """Payload for user sending a message into a chat thread."""
    content: str = Field(..., min_length=1, max_length=50000, description="Message text or command prompt")
    stream: bool = Field(default=False, description="Whether to request SSE token streaming")


class ChatMessageResponse(BaseModel):
    """Individual message record response."""
    id: str
    tenant_id: str
    thread_id: str
    sender_type: str
    sender_id: str
    content: str
    recalled_memory_ids: List[str] = Field(default_factory=list)
    tool_invocations: List[Dict[str, Any]] = Field(default_factory=list)
    gate_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ChatEphemeralRunRequest(BaseModel):
    """Payload to request an ephemeral single-worker execution run from chat."""
    worker_id: str = Field(..., description="Target worker ID to execute the action")
    tool: str = Field(..., description="Tool name, e.g. read_file, list_dir, web_search")
    args: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")
