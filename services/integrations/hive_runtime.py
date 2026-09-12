from __future__ import annotations

import asyncio
from contextlib import AsyncExitStack
from typing import Any, Optional

from bee_hive.loader import load_all_servers
from bee_hive.registry import MCP_SERVERS
from bee_logging import write_log

from bee_core.executor.runtime_llm import reset_client

_runtime_stack: Optional[AsyncExitStack] = None
_runtime_tools: list[dict[str, Any]] = []
_runtime_router: dict[str, tuple[Any, str]] = {}
_runtime_failed: list[str] = []
_runtime_lock = asyncio.Lock()


async def ensure_runtime() -> tuple[
    list[dict[str, Any]], dict[str, tuple[Any, str]], list[str]
]:
    global _runtime_stack, _runtime_tools, _runtime_router, _runtime_failed

    if _runtime_stack is not None:
        return _runtime_tools, _runtime_router, _runtime_failed

    async with _runtime_lock:
        if _runtime_stack is not None:
            return _runtime_tools, _runtime_router, _runtime_failed

        stack = AsyncExitStack()
        await stack.__aenter__()

        try:
            all_tools, tool_router, failed = await load_all_servers(stack, MCP_SERVERS)
        except BaseException:
            try:
                await asyncio.shield(stack.aclose())
            except Exception:
                pass
            raise

        _runtime_stack = stack
        _runtime_tools = all_tools
        _runtime_router = tool_router
        _runtime_failed = failed

    return _runtime_tools, _runtime_router, _runtime_failed


async def pre_initialize_runtime() -> None:
    try:
        all_tools, _, failed = await ensure_runtime()
        server_count = len(MCP_SERVERS) - len(failed)
        await write_log(
            "INFO",
            "agent",
            "runtime_initialized",
            {
                "tool_count": len(all_tools),
                "server_count": server_count,
                "failed_servers": failed,
            },
        )
        print(f"\n{'=' * 55}")
        print(f"  ✅ {len(all_tools)} tools across {server_count} servers")
        if failed:
            print(f"  ⚠️  Skipped: {', '.join(failed)}")
        print(f"{'=' * 55}\n")
    except Exception as error:
        await write_log("ERROR", "agent", "runtime_init_failed", {"error": str(error)})
        print(f"\n❌ Hive runtime init failed: {error}\n")


async def shutdown_runtime() -> None:
    global _runtime_stack, _runtime_tools, _runtime_router, _runtime_failed

    if _runtime_stack is None:
        return

    def _contains_cross_task_close_error(exc: BaseException) -> bool:
        if "Attempted to exit cancel scope in a different task" in str(exc):
            return True
        children = getattr(exc, "exceptions", None)
        if not children:
            return False
        return any(_contains_cross_task_close_error(child) for child in children)

    try:
        await _runtime_stack.aclose()
    except Exception as error:
        if not _contains_cross_task_close_error(error):
            raise
    finally:
        _runtime_stack = None
        _runtime_tools = []
        _runtime_router = {}
        _runtime_failed = []
        reset_client()


def runtime_snapshot() -> dict[str, Any]:
    return {
        "runtime_initialized": _runtime_stack is not None,
        "tool_count": len(_runtime_tools),
        "failed_servers": list(_runtime_failed),
        "tools": _runtime_tools,
        "router_keys": list(_runtime_router.keys()),
        "configured_servers": list(MCP_SERVERS.keys()),
    }
