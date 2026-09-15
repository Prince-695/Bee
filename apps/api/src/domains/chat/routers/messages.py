"""Chat Messages and Ephemeral Tool Run Endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from bee_api.core.responses import error_response, success_response
from bee_api.domains.chat.schemas import (
    ChatEphemeralRunRequest,
    ChatMessageResponse,
    ChatMessageSendRequest,
)
from services.chat.engine import ChatEngine
from services.chat.runner import EphemeralWorkerRunner
from services.data.repositories.chat_repo import ChatRepository
from bee_logging import write_log

router = APIRouter(prefix="/v1/chat/threads/{thread_id}", tags=["Chat & Personal Workers"])

_repo = ChatRepository()
_engine = ChatEngine(chat_repo=_repo)
_runner = EphemeralWorkerRunner()


@router.get("/messages", status_code=status.HTTP_200_OK)
async def get_messages(
    thread_id: str,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> JSONResponse:
    """Retrieves chronologically ordered messages in a chat thread."""
    thread = await _repo.get_thread(thread_id)
    if not thread:
        return error_response("THREAD_NOT_FOUND", f"Chat thread '{thread_id}' not found.", 404)

    messages = await _repo.get_messages(thread_id, limit=limit, offset=offset)
    return success_response({"messages": [m.model_dump() for m in messages], "count": len(messages)})


@router.post("/messages", status_code=status.HTTP_200_OK)
async def send_message(thread_id: str, request: ChatMessageSendRequest) -> JSONResponse:
    """Sends a user message into a chat thread and triggers a contextual worker turn."""
    await write_log("INFO", "chat", "send_message_received", {"thread_id": thread_id, "length": len(request.content)})
    try:
        reply = await _engine.send_message(
            thread_id=thread_id,
            content=request.content,
        )
        return success_response(reply.model_dump())
    except Exception as exc:
        await write_log("ERROR", "chat", "send_message_failed", {"thread_id": thread_id, "error": str(exc)})
        return error_response("SEND_MESSAGE_FAILED", str(exc), 500)


@router.post("/runs", status_code=status.HTTP_200_OK)
async def run_ephemeral_tool(thread_id: str, request: ChatEphemeralRunRequest) -> JSONResponse:
    """Spawns an ephemeral single-worker tool run from chat with FileGuard and GateManager checks."""
    await write_log("INFO", "chat", "ephemeral_run_requested", {"thread_id": thread_id, "worker_id": request.worker_id, "tool": request.tool})
    try:
        res = await _runner.execute_tool(
            worker_id=request.worker_id,
            tool=request.tool,
            args=request.args,
            thread_id=thread_id,
        )
        return success_response(res)
    except Exception as exc:
        return error_response("EPHEMERAL_RUN_FAILED", str(exc), 500)
