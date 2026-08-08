from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Optional

from bee_core.executor.flight_executor import execute_flight
from bee_core.executor.hive_runtime import (
    ensure_runtime,
    pre_initialize_runtime,
    runtime_snapshot,
    shutdown_runtime,
)
from bee_core.executor.route_planner import (
    create_route,
    get_route,
    list_routes,
    pending_route_count,
)
from bee_core.stores.chat_store import save_chat
from bee_core.stores.flight_queue_store import (
    claim_flight_by_id,
    complete_flight_task,
    enqueue_deferred_flight,
)
from bee_core.webhook_queue import DeferredTask, TaskStatus, task_queue


async def run_agent(user_prompt: str) -> dict[str, Any]:
    """Single-call mode: Route → Flight immediately. Used by /api/agent/run."""
    _all_tools, _tool_router, failed = await ensure_runtime()

    webhook_config = needs_webhook(user_prompt)
    if webhook_config:
        task = task_queue.create_task(
            user_prompt=user_prompt,
            webhook_type=webhook_config["webhook_type"],
            webhook_filter=webhook_config["webhook_filter"],
        )
        enqueue_deferred_flight(
            user_prompt=user_prompt,
            webhook_type=webhook_config["webhook_type"],
            webhook_filter=webhook_config["webhook_filter"],
            task_id=task.task_id,
        )
        save_chat(
            prompt=user_prompt,
            route={
                "task_id": task.task_id,
                "webhook_type": webhook_config["webhook_type"],
                "webhook_filter": webhook_config["webhook_filter"],
            },
            result={"queued": True},
            status="waiting",
            chat_id=task.task_id,
            route_id=task.task_id,
        )
        asyncio.create_task(_handle_deferred_task(task))
        return {
            "queued": True,
            "task_id": task.task_id,
            "webhook_type": webhook_config["webhook_type"],
            "assistant_response": (
                f"✅ Task queued! Waiting for {webhook_config['webhook_type']} event..."
            ),
            "steps": [],
            "tool_step_count": 0,
            "failed_servers": failed,
        }

    route = await create_route(user_prompt)
    result = await execute_flight(route["route_id"])
    return {
        "queued": False,
        "failed_servers": failed,
        **result,
    }


def needs_webhook(user_prompt: str) -> Optional[dict[str, Any]]:
    prompt_lower = user_prompt.lower()

    if any(
        p in prompt_lower
        for p in [
            "when a pr",
            "when pr",
            "if a pr",
            "when pull request",
            "if pull request",
            "when someone opens",
            "when pushed",
        ]
    ):
        repo_match = re.search(
            r"(?:repo|repository)\s+['\"]?([\w][\w-]*)['\"]?", prompt_lower
        )
        repo = repo_match.group(1) if repo_match else "Bee"
        return {
            "webhook_type": "github_pr",
            "webhook_filter": {"repo": repo, "action": "opened"},
        }

    if any(
        p in prompt_lower
        for p in [
            "when a new issue",
            "when an issue",
            "when issue",
            "if an issue",
            "if a new issue",
            "issue is created",
            "issue is opened",
            "new issue",
        ]
    ):
        repo_match = re.search(
            r"(?:repo|repository)\s+['\"]?([\w][\w-]*)['\"]?", prompt_lower
        )
        repo = repo_match.group(1) if repo_match else "Bee"
        return {
            "webhook_type": "github_issue",
            "webhook_filter": {"repo": repo, "action": "opened"},
        }

    if any(
        p in prompt_lower
        for p in ["when someone messages", "when a message", "when slack"]
    ):
        return {"webhook_type": "slack_message", "webhook_filter": {}}

    return None


async def _handle_deferred_task(task: DeferredTask) -> None:
    await task.resume_event.wait()
    claimed = claim_flight_by_id(task.task_id)
    if claimed is None:
        # Flight worker (or another process) already claimed this task.
        return

    followup = (
        f"{task.user_prompt}\n\n"
        "The event you were waiting for just fired. Event data:\n"
        f"{json.dumps(task.event_data, indent=2)}\n\n"
        "Now complete the action you were supposed to take."
    )
    try:
        route = await create_route(followup)
        flight_result = await execute_flight(route["route_id"])
        save_chat(
            prompt=task.user_prompt,
            route={
                "task_id": task.task_id,
                "webhook_type": task.webhook_type,
                "webhook_filter": task.webhook_filter,
                "event_data": task.event_data,
                "followup_route_id": route["route_id"],
            },
            result=flight_result,
            status="completed",
            chat_id=task.task_id,
            route_id=task.task_id,
        )
        complete_flight_task(
            task.task_id,
            route_id=route["route_id"],
            result=flight_result,
            failed=False,
        )
        task.status = TaskStatus.DONE
    except Exception as error:
        save_chat(
            prompt=task.user_prompt,
            route={
                "task_id": task.task_id,
                "webhook_type": task.webhook_type,
                "webhook_filter": task.webhook_filter,
                "event_data": task.event_data,
            },
            result={"error": str(error)},
            status="failed",
            chat_id=task.task_id,
            route_id=task.task_id,
        )
        complete_flight_task(
            task.task_id,
            route_id=None,
            result={"error": str(error)},
            failed=True,
        )
        task.status = TaskStatus.FAILED


def runtime_status() -> dict[str, Any]:
    waiting = task_queue.get_waiting_tasks()
    snap = runtime_snapshot()
    return {
        "runtime_initialized": snap["runtime_initialized"],
        "tool_count": snap["tool_count"],
        "failed_servers": snap["failed_servers"],
        "configured_servers": snap["configured_servers"],
        "waiting_task_count": len(waiting),
        "pending_routes": pending_route_count(),
        "waiting_tasks": [
            {"id": t.task_id, "type": t.webhook_type, "status": t.status.value}
            for t in waiting
        ],
    }


# Public aliases used by API layer
plan_agent = create_route
execute_plan = execute_flight
get_plan = get_route
list_plans = list_routes

__all__ = [
    "create_route",
    "execute_flight",
    "get_route",
    "list_routes",
    "run_agent",
    "runtime_status",
    "pre_initialize_runtime",
    "shutdown_runtime",
    "needs_webhook",
    "plan_agent",
    "execute_plan",
    "get_plan",
    "list_plans",
]
