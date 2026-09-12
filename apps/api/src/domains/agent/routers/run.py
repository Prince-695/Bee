"""Agent Execution, Flights, and Hooks Summary Router."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from bee_api.domains.agent.schemas import AgentRunRequest
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
from bee_core.stores.gate_store import get_gate, list_gates, resolve_gate
from bee_core.webhook_queue import DeferredTask, TaskStatus, task_queue
from bee_logging import write_log

router = APIRouter(tags=["agent"])


def _success(data: Any) -> JSONResponse:
    return JSONResponse(status_code=200, content={"success": True, "data": data})


def _error(code: str, message: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"success": False, "error": {"code": code, "message": message}})


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
    await write_log("INFO", "agent", "prompt_received", {"prompt": request.prompt[:200]})
    try:
        result = await run_agent(request.prompt)
        return _success(result)
    except RuntimeError as error:
        message = str(error)
        if "LLM_API_KEY is not configured" in message:
            return _error("AGENT_NOT_CONFIGURED", "Set LLM_API_KEY in backend .env and restart.", 503)
        return _error("INTERNAL_ERROR", message or "Unexpected error", 500)
    except Exception as error:
        await write_log("ERROR", "agent", "agent_run_failed", {"error_type": type(error).__name__, "message": str(error)})
        return _error("INTERNAL_ERROR", "Unexpected error", 500)


@router.post("/api/agent/route")
async def generate_route(request: AgentRunRequest) -> JSONResponse:
    await write_log("INFO", "agent", "route_requested", {"prompt": request.prompt[:200]})
    try:
        route = await create_route(request.prompt)
        return _success(route)
    except Exception as error:
        return _error("INTERNAL_ERROR", str(error), 500)


@router.post("/api/agent/flight/{route_id}")
async def execute_approved_flight(route_id: str) -> JSONResponse:
    route = get_route(route_id)
    if not route:
        return _error("ROUTE_NOT_FOUND", f"Route {route_id} not found or expired", 404)
    await create_stream(route_id)
    try:
        result = await execute_flight(route_id)
        return _success(result)
    except Exception as error:
        return _error("FLIGHT_FAILED", str(error), 500)
    finally:
        await remove_stream(route_id)


@router.get("/api/agent/flight/{route_id}/stream")
async def stream_flight(route_id: str) -> StreamingResponse:
    stream = await get_stream(route_id) or await create_stream(route_id)
    return StreamingResponse(
        stream.events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/api/agent/routes")
async def get_all_routes() -> JSONResponse:
    return _success(list_routes())


@router.get("/api/agent/route/{route_id}")
async def get_route_detail(route_id: str) -> JSONResponse:
    route = get_route(route_id)
    if not route:
        return _error("ROUTE_NOT_FOUND", f"Route {route_id} not found", 404)
    return _success(route)


@router.get("/api/agent/gates")
async def list_approval_gates(route_id: str | None = None, status: str | None = None) -> JSONResponse:
    return _success(list_gates(route_id=route_id, status=status))


@router.post("/api/agent/gates/{gate_id}/approve")
async def approve_gate(gate_id: str) -> JSONResponse:
    gate = resolve_gate(gate_id, "approved")
    if not gate:
        return _error("GATE_NOT_FOUND", f"Approval gate {gate_id} not found", 404)
    return _success(gate)


@router.post("/api/agent/gates/{gate_id}/reject")
async def reject_gate(gate_id: str) -> JSONResponse:
    gate = resolve_gate(gate_id, "rejected")
    if not gate:
        return _error("GATE_NOT_FOUND", f"Approval gate {gate_id} not found", 404)
    return _success(gate)


@router.get("/api/chats")
async def get_recent_chats(limit: int = 50) -> JSONResponse:
    return _success(get_chats(limit=limit))


@router.get("/api/chats/waiting")
async def get_waiting_tasks() -> JSONResponse:
    waiting = task_queue.get_waiting_tasks()
    return _success([task.to_dict(include_event_data=False) for task in waiting])


@router.get("/api/chats/hooks")
async def get_hooks_summary_route() -> JSONResponse:
    return _success(build_hooks_summary(task_queue.get_tasks()))


@router.get("/api/chats/{chat_id}")
async def get_chat_detail(chat_id: str) -> JSONResponse:
    chat = get_chat(chat_id)
    if not chat:
        return _error("CHAT_NOT_FOUND", f"Chat {chat_id} not found", 404)
    return _success(chat)


@router.get("/api/agent/runtime")
async def get_agent_runtime_status() -> JSONResponse:
    return _success(runtime_status())


@router.get("/api/hive/registry")
async def get_hive_registry() -> JSONResponse:
    status = runtime_status()
    servers = []
    failed = set(status.get("failed_servers") or [])
    for name in status.get("configured_servers") or []:
        servers.append({"name": name, "status": "failed" if name in failed else ("ready" if status.get("runtime_initialized") else "pending")})
    return _success({"servers": servers, "tool_count": status.get("tool_count", 0), "runtime_initialized": status.get("runtime_initialized", False), "failed_servers": status.get("failed_servers", [])})


@router.post("/api/agent/runtime/shutdown")
async def shutdown_agent_runtime() -> JSONResponse:
    await shutdown_runtime()
    return _success({"runtime_shutdown": True})
