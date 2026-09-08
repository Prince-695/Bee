"""General Health Check Endpoint (/api/health and /health)."""

from __future__ import annotations

import time
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from bee_core.executor.agent_runtime import runtime_status
from bee_api.core.responses import success_response

router = APIRouter(tags=["Health & Readiness"])
START_TIME_MONOTONIC = time.monotonic()


@router.get("/api/health")
@router.get("/health")
async def health_check() -> JSONResponse:
    uptime_seconds = int(time.monotonic() - START_TIME_MONOTONIC)
    try:
        agent_status = runtime_status()
        tool_count = agent_status.get("tool_count", 0)
        runtime_initialized = agent_status.get("runtime_initialized", False)
        failed_servers = agent_status.get("failed_servers", [])
    except Exception:
        tool_count = 0
        runtime_initialized = False
        failed_servers = []

    return success_response({
        "status": "ok",
        "uptime_seconds": uptime_seconds,
        "runtime_initialized": runtime_initialized,
        "tool_count": tool_count,
        "failed_servers": failed_servers,
    })
