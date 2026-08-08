from __future__ import annotations

import uuid
from typing import Any

from bee_core.config import (
    LLM_MAX_TOKENS,
    LLM_MODEL,
    LLM_TEMPERATURE,
    LLM_TOP_P,
)
from bee_core.executor.hive_runtime import ensure_runtime
from bee_core.executor.prompts import PLANNING_PROMPT, SERVER_ICONS
from bee_core.executor.runtime_llm import (
    extract_text_content,
    get_client,
    llm_extra_body,
    parse_route_json,
)
from bee_core.stores.chat_store import save_chat
from bee_logging import write_log

_pending_routes: dict[str, dict[str, Any]] = {}


def store_route(route: dict[str, Any]) -> None:
    _pending_routes[route["route_id"]] = route


def get_route(route_id: str) -> dict[str, Any] | None:
    return _pending_routes.get(route_id)


def list_routes() -> list[dict[str, Any]]:
    return [
        {
            "route_id": route["route_id"],
            "prompt": route["prompt"][:100],
            "status": route["status"],
            "step_count": route["step_count"],
        }
        for route in _pending_routes.values()
    ]


def pending_route_count() -> int:
    return len(_pending_routes)


async def create_route(user_prompt: str) -> dict[str, Any]:
    """Generate a Route (DAG steps) from the user prompt."""
    all_tools, tool_router, failed = await ensure_runtime()

    print(f"\n{'─' * 55}")
    print(f"👤 You: {user_prompt}")
    print(f"{'─' * 55}")
    print("📋 Generating route...\n")

    await write_log("INFO", "agent", "route_start", {"prompt": user_prompt[:200]})

    tool_descriptions = []
    for tool in all_tools:
        func = tool.get("function", {})
        tool_descriptions.append(
            f"  - {func.get('name', '?')}: {func.get('description', '')[:100]}"
        )
    tool_list_text = "\n".join(tool_descriptions)

    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": PLANNING_PROMPT + f"\n\nAvailable tools:\n{tool_list_text}",
        },
        {"role": "user", "content": user_prompt},
    ]

    client = get_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        temperature=LLM_TEMPERATURE,
        top_p=LLM_TOP_P,
        max_tokens=LLM_MAX_TOKENS,
        stream=False,
        extra_body=llm_extra_body(),
    )

    raw_response = extract_text_content(
        getattr(response.choices[0].message, "content", "")
    )

    route_data = parse_route_json(raw_response)
    if not route_data or not route_data.get("steps"):
        await write_log(
            "WARN", "agent", "route_parse_failed", {"raw": raw_response[:500]}
        )
        route_data = {
            "route_summary": "Execute the request directly",
            "plan_summary": "Execute the request directly",
            "steps": [
                {
                    "step": 1,
                    "description": user_prompt,
                    "server": "unknown",
                    "tool": "auto",
                    "args": {},
                    "depends_on": [],
                }
            ],
        }

    route_id = str(uuid.uuid4())[:8]

    for step in route_data.get("steps", []):
        server = step.get("server", "unknown").lower()
        step["server_icon"] = SERVER_ICONS.get(server, "🔧")
        tool_name = step.get("tool", "")
        if tool_name in tool_router:
            _, actual_server = tool_router[tool_name]
            step["server"] = actual_server
            step["server_icon"] = SERVER_ICONS.get(actual_server, "🔧")

    summary = route_data.get("route_summary") or route_data.get("plan_summary", "")
    route = {
        "route_id": route_id,
        "prompt": user_prompt,
        "route_summary": summary,
        "steps": route_data.get("steps", []),
        "step_count": len(route_data.get("steps", [])),
        "failed_servers": failed,
        "status": "pending",
    }

    store_route(route)

    save_chat(
        prompt=user_prompt,
        route=route,
        result=None,
        status="routed",
        chat_id=route_id,
        route_id=route_id,
    )

    print(f"📋 Route [{route_id}]: {route.get('route_summary', '')}")
    for step in route.get("steps", []):
        icon = step.get("server_icon", "🔧")
        print(
            f"   {icon} Step {step.get('step', '?')}: "
            f"[{step.get('server', '?')}] → {step.get('tool', '?')}"
        )
        print(f"      └─ {step.get('description', '')}")
    print("\n⏳ Waiting for approval...\n")

    await write_log(
        "INFO",
        "agent",
        "route_generated",
        {"route_id": route_id, "step_count": len(route.get("steps", []))},
    )

    return route
