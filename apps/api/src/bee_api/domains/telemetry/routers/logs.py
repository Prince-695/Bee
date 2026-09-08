"""Frontend Logs Ingestion & Real-Time Log Streaming Router."""

from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, StreamingResponse
from bee_api.domains.telemetry.schemas import FrontendLogRequest
from bee_logging import subscribe, unsubscribe, write_log

router = APIRouter(tags=["logs"])


async def _log_event_stream(execution_id: str | None) -> AsyncIterator[str]:
    subscriber_queue = await subscribe(execution_id)
    try:
        while True:
            try:
                entry = await asyncio.wait_for(subscriber_queue.get(), timeout=15)
                payload = entry if isinstance(entry, dict) and "type" in entry else {"type": "log", "entry": entry}
                yield f"data: {json.dumps(payload)}\n\n"
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
    finally:
        await unsubscribe(execution_id, subscriber_queue)


@router.get("/api/logs/stream")
async def stream_logs(execution_id: str | None = Query(default=None)) -> StreamingResponse:
    return StreamingResponse(
        _log_event_stream(execution_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/api/logs/frontend")
async def ingest_frontend_log(request: FrontendLogRequest) -> JSONResponse:
    await write_log("INFO", "frontend", request.event, request.metadata)
    return JSONResponse(status_code=200, content={"success": True, "data": {"logged": True}})
