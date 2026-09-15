"""Chat Domain Models: Threads, Messages, Streaming Events, and Ephemeral Runs."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SenderType(str, Enum):
    """Message sender actor type."""
    USER = "user"
    WORKER = "worker"
    SYSTEM = "system"


class ChatThread(BaseModel):
    """Chat thread session, either Universal Orchestrator or 1:1 Worker."""
    id: str = Field(default_factory=lambda: f"thread-{uuid.uuid4().hex[:12]}")
    tenant_id: str = "default"
    user_id: str = "default-user"
    project_id: Optional[str] = None
    worker_id: Optional[str] = None  # None for Universal Orchestrator, UUID for 1:1 Worker
    title: str = "New Chat"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)


class ChatThreadCreate(BaseModel):
    """Payload to create a new chat thread."""
    worker_id: Optional[str] = Field(default=None, description="Target worker ID for 1:1 chat, or None for Universal Orchestrator")
    project_id: Optional[str] = Field(default=None, description="Optional project context scope")
    title: Optional[str] = Field(default=None, description="Initial thread title")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatThreadUpdate(BaseModel):
    """Payload to update an existing chat thread."""
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatMessage(BaseModel):
    """Individual conversational turn or tool action record."""
    id: str = Field(default_factory=lambda: f"msg-{uuid.uuid4().hex[:12]}")
    tenant_id: str = "default"
    thread_id: str
    sender_type: SenderType = SenderType.USER
    sender_id: str = "user"
    content: str
    recalled_memory_ids: List[str] = Field(default_factory=list)
    tool_invocations: List[Dict[str, Any]] = Field(default_factory=list)
    gate_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_utc_now_iso)


class ChatMessageCreate(BaseModel):
    """Payload for user posting a message to a chat thread."""
    content: str = Field(..., min_length=1, max_length=50000, description="User prompt or command")
    stream: bool = Field(default=False, description="Whether to stream response tokens via SSE")


class ChatStreamEventType(str, Enum):
    """Typed events emitted during SSE streaming."""
    CHUNK = "chunk"
    MEMORY_CITATION = "memory_citation"
    TOOL_START = "tool_start"
    TOOL_END = "tool_end"
    GATE_REQUESTED = "gate_requested"
    DONE = "done"
    ERROR = "error"


class ChatStreamEvent(BaseModel):
    """Payload envelope for SSE streamed chunks."""
    event: ChatStreamEventType
    data: Dict[str, Any] = Field(default_factory=dict)


class ChatEphemeralRunRequest(BaseModel):
    """Payload to trigger an ephemeral single-worker execution run from chat."""
    worker_id: str = Field(..., description="Worker to execute the task")
    command: str = Field(..., description="Action, query, or tool command to run")
    project_id: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
