"""Real-Time SSE Streaming Endpoint for Chat and Ephemeral Worker Turns."""

from __future__ import annotations

import json
from typing import Optional
from fastapi import APIRouter, Query, status
from sse_starlette.sse import EventSourceResponse

from bee_api.domains.chat.schemas import ChatMessageSendRequest
from services.chat.engine import ChatEngine
from services.data.repositories.chat_repo import ChatRepository

router = APIRouter(prefix="/v1/chat/threads/{thread_id}/stream", tags=["Chat & Personal Workers"])

_repo = ChatRepository()
_engine = ChatEngine(chat_repo=_repo)


@router.get("", status_code=status.HTTP_200_OK)
async def stream_chat_turn_get(
    thread_id: str,
    prompt: str = Query(..., description="User prompt to stream"),
):
    """Streams assistant tokens, memory citations, and tool progress using standard GET EventSource."""
    async def event_generator():
        async for ev in _engine.stream_message(thread_id=thread_id, content=prompt):
            yield {"event": ev.event.value, "data": json.dumps(ev.data)}

    return EventSourceResponse(event_generator())


@router.post("", status_code=status.HTTP_200_OK)
async def stream_chat_turn_post(
    thread_id: str,
    request: ChatMessageSendRequest,
):
    """Streams assistant tokens, memory citations, and tool progress using POST payload."""
    async def event_generator():
        async for ev in _engine.stream_message(thread_id=thread_id, content=request.content):
            yield {"event": ev.event.value, "data": json.dumps(ev.data)}

    return EventSourceResponse(event_generator())
