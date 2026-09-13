"""Chat Repository for Bee Platform.

Dual-mode data access for conversation threads and messages across PostgreSQL and SQLite.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from services.data.repository import BaseRepository
from services.chat.models import ChatMessage, ChatThread, SenderType, _utc_now_iso


class ChatRepository(BaseRepository):
    """Data access layer for persistent chat threads and message history."""

    # ─── Threads ───

    async def create_thread(self, thread: ChatThread) -> ChatThread:
        """Create and store a new chat thread."""
        meta_json = json.dumps(thread.metadata)
        await self.db.execute(
            """
            INSERT INTO chat_threads (
                id, tenant_id, user_id, project_id, worker_id, title, metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                thread.id,
                thread.tenant_id,
                thread.user_id,
                thread.project_id,
                thread.worker_id,
                thread.title,
                meta_json,
                thread.created_at,
                thread.updated_at,
            ),
        )
        return thread

    async def get_thread(self, thread_id: str, tenant_id: str = "default") -> Optional[ChatThread]:
        """Fetch a specific chat thread by ID."""
        row = await self.db.fetch_one(
            "SELECT * FROM chat_threads WHERE id = ? AND tenant_id = ?",
            (thread_id, tenant_id),
        )
        if not row:
            return None
        return self._row_to_thread(row)

    async def list_threads(
        self,
        tenant_id: str = "default",
        user_id: Optional[str] = None,
        worker_id: Optional[str] = None,
        project_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ChatThread]:
        """List chat threads with optional filtering by worker, user, or project."""
        query = "SELECT * FROM chat_threads WHERE tenant_id = ?"
        params: List[Any] = [tenant_id]

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        if worker_id is not None:
            if worker_id == "universal" or worker_id == "":
                query += " AND worker_id IS NULL"
            else:
                query += " AND worker_id = ?"
                params.append(worker_id)
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)

        query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = await self.db.fetch_all(query, tuple(params))
        return [self._row_to_thread(r) for r in rows]

    async def update_thread(
        self,
        thread_id: str,
        title: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tenant_id: str = "default",
    ) -> Optional[ChatThread]:
        """Update thread title or metadata, updating updated_at timestamp."""
        thread = await self.get_thread(thread_id, tenant_id=tenant_id)
        if not thread:
            return None

        new_title = title if title is not None else thread.title
        new_meta = {**thread.metadata, **(metadata or {})} if metadata else thread.metadata
        now = _utc_now_iso()

        await self.db.execute(
            "UPDATE chat_threads SET title = ?, metadata_json = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
            (new_title, json.dumps(new_meta), now, thread_id, tenant_id),
        )
        thread.title = new_title
        thread.metadata = new_meta
        thread.updated_at = now
        return thread

    async def delete_thread(self, thread_id: str, tenant_id: str = "default") -> bool:
        """Delete a chat thread and all cascading messages."""
        thread = await self.get_thread(thread_id, tenant_id=tenant_id)
        if not thread:
            return False
        await self.db.execute(
            "DELETE FROM chat_threads WHERE id = ? AND tenant_id = ?",
            (thread_id, tenant_id),
        )
        return True

    # ─── Messages ───

    async def save_message(self, message: ChatMessage) -> ChatMessage:
        """Store a chat message and bump the parent thread's updated_at."""
        recalled_json = json.dumps(message.recalled_memory_ids)
        tool_json = json.dumps(message.tool_invocations)
        meta_json = json.dumps(message.metadata)

        await self.db.execute(
            """
            INSERT INTO chat_messages (
                id, tenant_id, thread_id, sender_type, sender_id, content,
                recalled_memory_ids_json, tool_invocations_json, gate_id, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message.id,
                message.tenant_id,
                message.thread_id,
                message.sender_type.value if hasattr(message.sender_type, "value") else str(message.sender_type),
                message.sender_id,
                message.content,
                recalled_json,
                tool_json,
                message.gate_id,
                meta_json,
                message.created_at,
            ),
        )
        # Bump thread updated_at
        await self.db.execute(
            "UPDATE chat_threads SET updated_at = ? WHERE id = ? AND tenant_id = ?",
            (message.created_at, message.thread_id, message.tenant_id),
        )
        return message

    async def get_messages(
        self,
        thread_id: str,
        limit: int = 100,
        offset: int = 0,
        tenant_id: str = "default",
    ) -> List[ChatMessage]:
        """Fetch chronologically ordered messages in a chat thread."""
        rows = await self.db.fetch_all(
            """
            SELECT * FROM chat_messages
            WHERE thread_id = ? AND tenant_id = ?
            ORDER BY created_at ASC
            LIMIT ? OFFSET ?
            """,
            (thread_id, tenant_id, limit, offset),
        )
        return [self._row_to_message(r) for r in rows]

    async def delete_message(self, message_id: str, tenant_id: str = "default") -> bool:
        """Delete an individual chat message."""
        await self.db.execute(
            "DELETE FROM chat_messages WHERE id = ? AND tenant_id = ?",
            (message_id, tenant_id),
        )
        return True

    # ─── Helpers ───

    def _row_to_thread(self, row: Any) -> ChatThread:
        data = dict(row)
        meta_raw = data.get("metadata_json") or "{}"
        metadata = json.loads(meta_raw) if isinstance(meta_raw, str) else meta_raw
        return ChatThread(
            id=str(data["id"]),
            tenant_id=str(data.get("tenant_id", "default")),
            user_id=str(data.get("user_id", "default-user")),
            project_id=str(data["project_id"]) if data.get("project_id") else None,
            worker_id=str(data["worker_id"]) if data.get("worker_id") else None,
            title=str(data.get("title", "New Chat")),
            metadata=metadata,
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", "")),
        )

    def _row_to_message(self, row: Any) -> ChatMessage:
        data = dict(row)
        recalled_raw = data.get("recalled_memory_ids_json") or "[]"
        recalled = json.loads(recalled_raw) if isinstance(recalled_raw, str) else recalled_raw
        tool_raw = data.get("tool_invocations_json") or "[]"
        tools = json.loads(tool_raw) if isinstance(tool_raw, str) else tool_raw
        meta_raw = data.get("metadata_json") or "{}"
        metadata = json.loads(meta_raw) if isinstance(meta_raw, str) else meta_raw

        return ChatMessage(
            id=str(data["id"]),
            tenant_id=str(data.get("tenant_id", "default")),
            thread_id=str(data["thread_id"]),
            sender_type=SenderType(data.get("sender_type", "user")),
            sender_id=str(data.get("sender_id", "user")),
            content=str(data.get("content", "")),
            recalled_memory_ids=recalled,
            tool_invocations=tools,
            gate_id=str(data["gate_id"]) if data.get("gate_id") else None,
            metadata=metadata,
            created_at=str(data.get("created_at", "")),
        )
