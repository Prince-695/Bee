"""Conversation Turn Handler Endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from bee_core.stores.conversation_store import get_conversation_session
from bee_core.executor.conversation_runtime import handle_conversation_turn
from bee_api.core.responses import error_response, success_response

router = APIRouter(prefix="/v1/conversation", tags=["General Chat & Conversation"])


@router.post("/{conversation_id}/turn")
async def handle_conversation_turn_route(conversation_id: str) -> JSONResponse:
    """Trigger agent turn execution for the conversation session."""
    session = get_conversation_session(conversation_id)
    if not session:
        return error_response("CONVERSATION_NOT_FOUND", f"Conversation {conversation_id} not found", 404)
    result = await handle_conversation_turn(conversation_id)
    return success_response(result)
