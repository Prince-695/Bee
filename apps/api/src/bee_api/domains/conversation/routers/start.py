"""Conversation Initiation Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from bee_core.executor.conversation_runtime import start_conversation
from bee_api.domains.conversation.schemas import GeneralChatStartRequest
from bee_api.response_helpers import error_response, success_response
from bee_logging import write_log

router = APIRouter(prefix="/v1/conversation", tags=["General Chat & Conversation"])


@router.post("/start", status_code=status.HTTP_200_OK)
async def start_general_chat(request: GeneralChatStartRequest) -> JSONResponse:
    """Initiate a general chat conversation with AI Co-Engineer (workspace connection is optional)."""
    await write_log("INFO", "conversation", "start_requested", {"prompt": request.prompt[:200], "workspace_id": request.workspace_id})
    try:
        # Prompt can optionally include workspace context if connected
        effective_prompt = request.prompt
        if request.workspace_id:
            effective_prompt = f"[Workspace Context: {request.workspace_id}]\n{request.prompt}"

        result = await start_conversation(effective_prompt)
        if isinstance(result, dict) and request.workspace_id:
            result["workspace_id"] = request.workspace_id
        return success_response(result)
    except RuntimeError as error:
        message = str(error)
        if "LLM_API_KEY is not configured" in message:
            return error_response("AGENT_NOT_CONFIGURED", "Set LLM_API_KEY or NVIDIA_API_KEY in backend and restart.", 503)
        return error_response("INTERNAL_ERROR", message or "Unexpected error", 500)
    except Exception as error:
        await write_log(
            "ERROR",
            "conversation",
            "start_failed",
            {"error_type": type(error).__name__, "message": str(error)},
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)
