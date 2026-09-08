"""Conversation Message Endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from bee_core.executor.conversation_runtime import send_conversation_message
from bee_api.domains.conversation.schemas import ChatMessageRequest
from bee_api.response_helpers import error_response, success_response
from bee_logging import write_log

router = APIRouter(prefix="/v1/conversation", tags=["General Chat & Conversation"])


@router.post("/{conversation_id}/message")
async def send_chat_message(conversation_id: str, request: ChatMessageRequest) -> JSONResponse:
    """Send user message to an ongoing conversation turn."""
    await write_log(
        "INFO",
        "conversation",
        "message_received",
        {"conversation_id": conversation_id, "message": request.message[:200]},
    )
    try:
        result = await send_conversation_message(conversation_id, request.message)
        return success_response(result)
    except RuntimeError as error:
        message = str(error)
        if "LLM_API_KEY is not configured" in message:
            return error_response("AGENT_NOT_CONFIGURED", "Set LLM_API_KEY or NVIDIA_API_KEY in backend and restart.", 503)
        if "not found" in message.lower():
            return error_response("CONVERSATION_NOT_FOUND", message, 404)
        return error_response("INTERNAL_ERROR", message or "Unexpected error", 500)
    except Exception as error:
        await write_log(
            "ERROR",
            "conversation",
            "message_failed",
            {"conversation_id": conversation_id, "error_type": type(error).__name__, "message": str(error)},
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)
