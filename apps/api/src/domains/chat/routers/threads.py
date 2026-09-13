"""Chat Thread Management Endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse

from bee_api.core.responses import error_response, success_response
from bee_api.domains.chat.schemas import ChatThreadCreateRequest, ChatThreadResponse
from services.chat.engine import ChatEngine
from services.chat.models import ChatThread
from services.data.repositories.chat_repo import ChatRepository
from bee_logging import write_log

router = APIRouter(prefix="/v1/chat/threads", tags=["Chat & Personal Workers"])

_repo = ChatRepository()
_engine = ChatEngine(chat_repo=_repo)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_thread(request: ChatThreadCreateRequest) -> JSONResponse:
    """Creates a new Universal or 1:1 Worker chat thread."""
    await write_log("INFO", "chat", "create_thread_requested", {"worker_id": request.worker_id, "title": request.title})
    try:
        thread = await _engine.get_or_create_thread(
            worker_id=request.worker_id,
            project_id=request.project_id,
            title=request.title,
        )
        return success_response(thread.model_dump(), status_code=status.HTTP_201_CREATED)
    except Exception as exc:
        await write_log("ERROR", "chat", "create_thread_failed", {"error": str(exc)})
        return error_response("CREATE_THREAD_FAILED", str(exc), 500)


@router.get("", status_code=status.HTTP_200_OK)
async def list_threads(
    worker_id: Optional[str] = Query(default=None, description="Filter by worker ID or 'universal'"),
    project_id: Optional[str] = Query(default=None, description="Filter by project ID"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> JSONResponse:
    """Lists recent conversation threads for the user."""
    try:
        threads = await _repo.list_threads(
            worker_id=worker_id,
            project_id=project_id,
            limit=limit,
            offset=offset,
        )
        return success_response({"threads": [t.model_dump() for t in threads], "count": len(threads)})
    except Exception as exc:
        return error_response("LIST_THREADS_FAILED", str(exc), 500)


@router.get("/{thread_id}", status_code=status.HTTP_200_OK)
async def get_thread(thread_id: str) -> JSONResponse:
    """Retrieves metadata for a specific chat thread."""
    thread = await _repo.get_thread(thread_id)
    if not thread:
        return error_response("THREAD_NOT_FOUND", f"Chat thread '{thread_id}' not found.", 404)
    return success_response(thread.model_dump())


@router.delete("/{thread_id}", status_code=status.HTTP_200_OK)
async def delete_thread(thread_id: str) -> JSONResponse:
    """Deletes a chat thread and all associated messages."""
    deleted = await _repo.delete_thread(thread_id)
    if not deleted:
        return error_response("THREAD_NOT_FOUND", f"Chat thread '{thread_id}' not found.", 404)
    return success_response({"deleted": True, "thread_id": thread_id})
