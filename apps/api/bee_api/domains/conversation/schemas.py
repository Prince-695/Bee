"""Conversation and General Chat Domain Schemas."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GeneralChatStartRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000, description="User question, engineering prompt, or general query")
    workspace_id: Optional[str] = Field(default=None, description="Optional workspace ID if chatting within a specific project context")


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)


class ChatMessageItem(BaseModel):
    id: str
    conversation_id: str
    turn_index: int
    role: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ChatSessionResponse(BaseModel):
    id: str
    initial_prompt: str
    state: str
    assistant_message: Optional[str] = None
    workspace_id: Optional[str] = None
    can_proceed: bool = False
    missing_info: List[str] = Field(default_factory=list)
    messages: List[ChatMessageItem] = Field(default_factory=list)
    created_at: str
    updated_at: str
