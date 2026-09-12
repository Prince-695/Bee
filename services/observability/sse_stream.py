"""SSE event stream manager for real-time Flight updates."""
from __future__ import annotations

import asyncio
import json
from typing import Any


class FlightStream:
    """Async queue-backed SSE stream for a single Flight."""

    def __init__(self, route_id: str):
        self.route_id = route_id
        self.queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue(maxsize=500)
        self.done = False

    def push(self, event_type: str, data: dict[str, Any] | None = None) -> None:
        payload = {"type": event_type, **(data or {})}
        try:
            self.queue.put_nowait(payload)
        except asyncio.QueueFull:
            try:
                self.queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
            self.queue.put_nowait(payload)

    def push_token(self, token: str) -> None:
        self.push("llm_token", {"token": token})

    def push_step_start(
        self, step: int, server: str, icon: str, tool: str, args: dict
    ) -> None:
        self.push(
            "step_start",
            {
                "step": step,
                "server": server,
                "server_icon": icon,
                "tool": tool,
                "args": args,
            },
        )

    def push_step_complete(self, step: int, result: str) -> None:
        self.push("step_complete", {"step": step, "result": result})

    def push_step_error(self, step: int, error: str) -> None:
        self.push("step_error", {"step": step, "error": error})

    def push_self_heal_retry(self, step: int, retry_count: int, error: str) -> None:
        self.push(
            "self_heal_retry",
            {"step": step, "retry_count": retry_count, "error": error},
        )

    def push_gate_pending(
        self,
        gate_id: str,
        step: int,
        server: str,
        tool: str,
        action_summary: str,
    ) -> None:
        self.push(
            "gate_pending",
            {
                "gate_id": gate_id,
                "step": step,
                "server": server,
                "tool": tool,
                "action_summary": action_summary,
            },
        )

    def push_gate_resolved(self, gate_id: str, status: str) -> None:
        self.push("gate_resolved", {"gate_id": gate_id, "status": status})

    def push_route_generated(self, route: dict[str, Any]) -> None:
        self.push("route_generated", {"route": route})

    def finish(self, summary: str = "") -> None:
        self.push("flight_complete", {"summary": summary})
        self.done = True
        try:
            self.queue.put_nowait(None)
        except asyncio.QueueFull:
            pass

    def finish_error(self, error: str) -> None:
        self.push("flight_error", {"error": error})
        self.done = True
        try:
            self.queue.put_nowait(None)
        except asyncio.QueueFull:
            pass

    async def events(self):
        while True:
            try:
                item = await asyncio.wait_for(self.queue.get(), timeout=30)
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
                continue

            if item is None:
                break

            yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"


_streams: dict[str, FlightStream] = {}
_streams_lock = asyncio.Lock()


async def create_stream(route_id: str) -> FlightStream:
    async with _streams_lock:
        stream = FlightStream(route_id)
        _streams[route_id] = stream
        return stream


async def get_stream(route_id: str) -> FlightStream | None:
    async with _streams_lock:
        return _streams.get(route_id)


async def remove_stream(route_id: str) -> None:
    async with _streams_lock:
        _streams.pop(route_id, None)


# Back-compat alias during internal refactors
ExecutionStream = FlightStream
