"""Conversation Repository for Bee Platform."""

from __future__ import annotations

from typing import Any, Dict, Optional
from bee_core.stores.conversation_store import (
    init_db,
    create_conversation_session,
    append_conversation_message,
    update_conversation_session,
    get_conversation_session,
)
from services.data.repository import BaseRepository


class ConversationRepository(BaseRepository):
    """Repository managing multi-turn agent conversation sessions."""

    def init_db(self) -> None:
        init_db()

    def create_session(self, initial_prompt: str, mode: str = "auto") -> Dict[str, Any]:
        return create_conversation_session(initial_prompt=initial_prompt, mode=mode)

    def get_session(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        return get_conversation_session(conversation_id=conversation_id)

    def update_session(self, conversation_id: str, **fields: Any) -> Dict[str, Any]:
        return update_conversation_session(conversation_id=conversation_id, **fields)

    def append_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return append_conversation_message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
        )


__all__ = [
    "ConversationRepository",
    "init_db",
    "create_conversation_session",
    "get_conversation_session",
    "update_conversation_session",
    "append_conversation_message",
]
