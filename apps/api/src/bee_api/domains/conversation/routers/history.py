"""Conversation History Endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from bee_core.stores.conversation_store import get_conversation_session
from bee_api.response_helpers import error_response, success_response

router = APIRouter(prefix="/v1/conversation", tags=["General Chat & Conversation"])


@router.get("/{conversation_id}")
async def get_conversation_history(conversation_id: str) -> JSONResponse:
    """Retrieve full conversation turn history and session state."""
    session = get_conversation_session(conversation_id)
    if not session:
        return error_response("CONVERSATION_NOT_FOUND", f"Conversation {conversation_id} not found", 404)
    return success_response(session)
