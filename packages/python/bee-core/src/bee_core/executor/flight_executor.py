"""Adaptive Flight Executor — runs Routes with self-healing feedback loop & Approval Gates."""

from __future__ import annotations

import json
from typing import Any

from bee_core.config import LLM_MAX_TOKENS, LLM_MODEL, LLM_TEMPERATURE, LLM_TOP_P
from bee_core.executor.flight_executor_helpers import (
    check_critical_action,
    generate_flight_summary,
    save_flight_record,
    wait_for_gate_approval,
)
from bee_core.executor.hive_runtime import ensure_runtime
from bee_core.executor.prompts import EXECUTION_PROMPT, SERVER_ICONS
from bee_core.executor.route_planner import get_route
from bee_core.executor.runtime_llm import (
    extract_text_content,
    format_tool_result,
    get_client,
    llm_extra_body,
)
from bee_core.executor.sse_stream import get_stream
from bee_core.stores.chat_store import save_chat
from bee_logging import write_log

MAX_RETRIES_PER_STEP = 2


async def _execute_tool_with_healing(
    session: Any,
    server_name: str,
    name: str,
    args: dict[str, Any],
    step_num: int,
    route_id: str,
    stream: Any,
) -> tuple[str, bool]:
    """Execute tool and detect if self-healing remediation is needed."""
    if not session:
        result_text = f"Unknown tool: {name}"
        if stream:
            stream.push_step_error(step_num, result_text)
        return result_text, False

    try:
        result = await session.call_tool(name, args)
        result_text = format_tool_result(result)
        is_error = False

        if isinstance(result_text, str) and (
            result_text.startswith("Tool error")
            or result_text.startswith("Tool returned error")
            or '"success": false' in result_text.lower()
            or '"passed": false' in result_text.lower()
        ):
            is_error = True

        if stream:
            if is_error:
                stream.push_step_error(step_num, result_text[:500])
            else:
                stream.push_step_complete(step_num, result_text[:500])

        return result_text, not is_error
    except Exception as error:
        detail = str(error).strip() or repr(error)
        result_text = f"Tool error ({type(error).__name__}): {detail}"
        if stream:
            stream.push_step_error(step_num, result_text[:500])
        return result_text, False


async def execute_flight(route_id: str) -> dict[str, Any]:
    """Execute an approved Route (a Flight) with adaptive self-healing & telemetry."""
    route = get_route(route_id)
    if not route:
        raise RuntimeError(f"Route {route_id} not found or expired")

    route["status"] = "flying"
    save_chat(
        prompt=route["prompt"],
        route=route,
        result=None,
        status="flying",
        chat_id=route_id,
        route_id=route_id,
    )
    all_tools, tool_router, _failed = await ensure_runtime()
    stream = await get_stream(route_id)

    await write_log(
        "INFO",
        "agent",
        "flight_start",
        {"route_id": route_id, "prompt": route["prompt"][:200]},
    )

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": EXECUTION_PROMPT},
        {"role": "user", "content": route["prompt"]},
    ]

    steps_executed: list[dict[str, Any]] = []
    step_num = 1
    max_steps = 30
    step_retry_counts: dict[str, int] = {}

    try:
        while step_num <= max_steps:
            client = get_client()
            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                tools=all_tools,
                tool_choice="auto",
                temperature=LLM_TEMPERATURE,
                top_p=LLM_TOP_P,
                max_tokens=LLM_MAX_TOKENS,
                stream=False,
                extra_body=llm_extra_body(),
            )
            msg = response.choices[0].message
            tool_calls = getattr(msg, "tool_calls", None) or []

            if tool_calls:
                messages.append(msg.model_dump())
                for tool_call in tool_calls:
                    name = tool_call.function.name
                    raw_args = tool_call.function.arguments or "{}"
                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else {}
                    except Exception:
                        args = {}

                    session, server_name = tool_router.get(name, (None, "unknown"))
                    icon = SERVER_ICONS.get(server_name, "🔧")

                    # Approval Gate check for critical actions
                    is_critical, action_summary = check_critical_action(name, args)
                    if is_critical:
                        approved, gate_msg = await wait_for_gate_approval(
                            route_id, step_num, server_name, name, args, action_summary, stream
                        )
                        if not approved:
                            result_text = f"Action cancelled: {gate_msg}"
                            messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result_text})
                            step_num += 1
                            continue

                    if stream:
                        stream.push_step_start(step_num, server_name, icon, name, args)

                    result_text, ok = await _execute_tool_with_healing(
                        session, server_name, name, args, step_num, route_id, stream
                    )

                    steps_executed.append(
                        {
                            "step": step_num,
                            "server": server_name,
                            "server_icon": icon,
                            "tool": name,
                            "args": args,
                            "result": result_text[:500],
                            "success": ok,
                        }
                    )

                    # Adaptive Self-Healing trigger
                    if not ok:
                        retries = step_retry_counts.get(name, 0) + 1
                        step_retry_counts[name] = retries
                        if retries <= MAX_RETRIES_PER_STEP:
                            if stream:
                                stream.push_self_heal_retry(step_num, retries, result_text[:200])
                            await write_log(
                                "WARN",
                                "agent",
                                "self_heal_retry",
                                {"route_id": route_id, "step": step_num, "tool": name, "retry": retries},
                            )
                            result_text += (
                                f"\n\n[SELF-HEAL ADVICE]: Step failed. Diagnose the error above and execute "
                                f"a fix step before retrying (Attempt {retries}/{MAX_RETRIES_PER_STEP})."
                            )

                    messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result_text})
                    step_num += 1
                    if step_num > max_steps:
                        break
                continue

            # Stream final summary
            assistant_text = extract_text_content(getattr(msg, "content", "")).strip()
            final_summary = await generate_flight_summary(client, messages, assistant_text, stream)

            payload = save_flight_record(
                route_id, route["prompt"], route, steps_executed, "completed", final_summary
            )
            await write_log("INFO", "agent", "flight_complete", {"route_id": route_id, "steps": len(steps_executed)})

            if stream:
                stream.finish(final_summary)
            return payload

    except Exception as error:
        save_flight_record(route_id, route["prompt"], route, steps_executed, "failed", error=str(error))
        if stream:
            stream.finish_error(str(error))
        raise

    summary = "Stopped after reaching maximum tool steps."
    payload = save_flight_record(route_id, route["prompt"], route, steps_executed, "completed", summary)
    if stream:
        stream.finish(summary)
    return payload
