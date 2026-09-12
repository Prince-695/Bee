"""Chat Repository for Bee Platform."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from bee_core.stores.chat_store import (
    init_db,
    save_chat,
    get_chat,
    get_chats,
)
from services.data.repository import BaseRepository


class ChatRepository(BaseRepository):
    """Repository managing chat sessions and records."""

    def init_db(self) -> None:
        init_db()

    def save_chat(
        self,
        prompt: str,
        route: Optional[Dict[str, Any]] = None,
        result: Optional[Dict[str, Any]] = None,
        status: str = "pending",
        chat_id: Optional[str] = None,
        route_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return save_chat(
            prompt=prompt,
            route=route,
            result=result,
            status=status,
            chat_id=chat_id,
            route_id=route_id,
        )

    def get_chat(self, chat_id: str) -> Optional[Dict[str, Any]]:
        return get_chat(chat_id=chat_id)

    def get_chats(self, limit: int = 50) -> List[Dict[str, Any]]:
        return get_chats(limit=limit)


__all__ = [
    "ChatRepository",
    "init_db",
    "save_chat",
    "get_chat",
    "get_chats",
]
