from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse

from bee_api.models import AgentRunRequest
from bee_api.response_helpers import error_response, success_response
from bee_core.executor.agent_runtime import (
    create_route,
    execute_flight,
    get_route,
    list_routes,
    run_agent,
    runtime_status,
    shutdown_runtime,
)
from bee_core.executor.sse_stream import create_stream, get_stream, remove_stream
from bee_core.stores.chat_store import get_chat, get_chats
from bee_core.webhook_queue import DeferredTask, TaskStatus, task_queue
from bee_logging import write_log

router = APIRouter()


def build_hooks_summary(tasks: list[DeferredTask]) -> dict[str, Any]:
    ordered_tasks = sorted(tasks, key=lambda task: task.created_at, reverse=True)
    active: list[dict[str, Any]] = []
    inactive: list[dict[str, Any]] = []
    breakdown = {status.value: 0 for status in TaskStatus}

    for task in ordered_tasks:
        breakdown[task.status.value] += 1
        payload = task.to_dict()
        if task.status in {TaskStatus.WAITING, TaskStatus.RESUMED}:
            active.append(payload)
        else:
            inactive.append(payload)

    return {
        "active": active,
        "inactive": inactive,
        "summary": {
            "total": len(ordered_tasks),
            "active_count": len(active),
            "inactive_count": len(inactive),
            "breakdown": breakdown,
        },
    }


@router.post("/api/agent/run")
async def run_agent_prompt(request: AgentRunRequest) -> JSONResponse:
    await write_log(
        "INFO", "agent", "prompt_received", {"prompt": request.prompt[:200]}
    )
    try:
        result = await run_agent(request.prompt)
        return success_response(result)
    except RuntimeError as error:
        message = str(error)
        if "LLM_API_KEY is not configured" in message:
            return error_response(
                "AGENT_NOT_CONFIGURED",
                "Set LLM_API_KEY or NVIDIA_API_KEY in backend .env and restart.",
                503,
            )
        return error_response("INTERNAL_ERROR", message or "Unexpected error", 500)
    except Exception as error:
        await write_log(
            "ERROR",
            "agent",
            "agent_run_failed",
            {"error_type": type(error).__name__, "message": str(error)},
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)


@router.post("/api/agent/route")
async def generate_route(request: AgentRunRequest) -> JSONResponse:
    await write_log(
        "INFO", "agent", "route_requested", {"prompt": request.prompt[:200]}
    )
    try:
        route = await create_route(request.prompt)
        return success_response(route)
    except RuntimeError as error:
        message = str(error)
        if "LLM_API_KEY is not configured" in message:
            return error_response(
                "AGENT_NOT_CONFIGURED",
                "Set LLM_API_KEY or NVIDIA_API_KEY in backend .env and restart.",
                503,
            )
        return error_response("INTERNAL_ERROR", message or "Unexpected error", 500)
    except Exception as error:
        await write_log(
            "ERROR",
            "agent",
            "route_failed",
            {"error_type": type(error).__name__, "message": str(error)},
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)


@router.post("/api/agent/flight/{route_id}")
async def execute_approved_flight(route_id: str) -> JSONResponse:
    route = get_route(route_id)
    if not route:
        return error_response(
            "ROUTE_NOT_FOUND", f"Route {route_id} not found or expired", 404
        )

    await write_log("INFO", "agent", "flight_requested", {"route_id": route_id})
    await create_stream(route_id)

    try:
        result = await execute_flight(route_id)
        return success_response(result)
    except RuntimeError as error:
        return error_response("FLIGHT_FAILED", str(error), 500)
    except Exception as error:
        await write_log(
            "ERROR",
            "agent",
            "flight_failed",
            {
                "route_id": route_id,
                "error_type": type(error).__name__,
                "message": str(error),
            },
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)
    finally:
        await remove_stream(route_id)


@router.get("/api/agent/flight/{route_id}/stream")
async def stream_flight(route_id: str) -> StreamingResponse:
    stream = await get_stream(route_id)
    if not stream:
        stream = await create_stream(route_id)

    return StreamingResponse(
        stream.events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/agent/routes")
async def get_all_routes() -> JSONResponse:
    return success_response(list_routes())


@router.get("/api/agent/route/{route_id}")
async def get_route_detail(route_id: str) -> JSONResponse:
    route = get_route(route_id)
    if not route:
        return error_response("ROUTE_NOT_FOUND", f"Route {route_id} not found", 404)
    return success_response(route)


@router.get("/api/chats")
async def get_recent_chats(limit: int = 50) -> JSONResponse:
    return success_response(get_chats(limit=limit))


@router.get("/api/chats/waiting")
async def get_waiting_tasks() -> JSONResponse:
    waiting = task_queue.get_waiting_tasks()
    return success_response(
        [task.to_dict(include_event_data=False) for task in waiting]
    )


@router.get("/api/chats/hooks")
async def get_hooks_summary_route() -> JSONResponse:
    return success_response(build_hooks_summary(task_queue.get_tasks()))


@router.get("/api/chats/{chat_id}")
async def get_chat_detail(chat_id: str) -> JSONResponse:
    chat = get_chat(chat_id)
    if not chat:
        return error_response("CHAT_NOT_FOUND", f"Chat {chat_id} not found", 404)
    return success_response(chat)


@router.get("/api/agent/runtime")
async def get_agent_runtime_status() -> JSONResponse:
    return success_response(runtime_status())


@router.get("/api/hive/registry")
async def get_hive_registry() -> JSONResponse:
    status = runtime_status()
    servers = []
    failed = set(status.get("failed_servers") or [])
    for name in status.get("configured_servers") or []:
        servers.append(
            {
                "name": name,
                "status": "failed" if name in failed else (
                    "ready" if status.get("runtime_initialized") else "pending"
                ),
            }
        )
    return success_response(
        {
            "servers": servers,
            "tool_count": status.get("tool_count", 0),
            "runtime_initialized": status.get("runtime_initialized", False),
            "failed_servers": status.get("failed_servers", []),
        }
    )


@router.post("/api/agent/runtime/shutdown")
async def shutdown_agent_runtime() -> JSONResponse:
    await shutdown_runtime()
    return success_response({"runtime_shutdown": True})
