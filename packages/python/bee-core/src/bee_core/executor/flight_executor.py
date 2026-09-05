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
    chat_completion_with_retry,
    extract_text_content,
    format_tool_result,
    get_client,
    llm_extra_body,
)
from bee_core.executor.sse_stream import get_stream
from bee_core.stores.chat_store import save_chat
from bee_logging import write_log

MAX_RETRIES_PER_STEP = 1


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

    steps_executed: list[dict[str, Any]] = []
    step_num = 1
    step_retry_counts: dict[str, int] = {}
    client = get_client()

    planned_steps = [
        s for s in route.get("steps", [])
        if isinstance(s, dict) and s.get("tool") and s.get("tool") != "auto" and s.get("tool") in tool_router
    ]

    try:
        # PATH A: Plan-Guided Execution (Saves ~90% LLM calls)
        # If the Route has concrete pre-planned tools, execute them deterministically.
        if len(planned_steps) > 0:
            for step_info in planned_steps:
                name = step_info.get("tool", "")
                raw_args = step_info.get("args") or {}
                args = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args if isinstance(raw_args, dict) else {})
                session, server_name = tool_router.get(name, (None, step_info.get("server", "unknown")))
                icon = step_info.get("server_icon") or SERVER_ICONS.get(server_name, "🔧")

                # Approval Gate check
                is_critical, action_summary = check_critical_action(name, args)
                if is_critical:
                    approved, gate_msg = await wait_for_gate_approval(
                        route_id, step_num, server_name, name, args, action_summary, stream
                    )
                    if not approved:
                        steps_executed.append({
                            "step": step_num,
                            "server": server_name,
                            "server_icon": icon,
                            "tool": name,
                            "args": args,
                            "result": f"Action cancelled: {gate_msg}",
                            "success": False,
                        })
                        step_num += 1
                        continue

                if stream:
                    stream.push_step_start(step_num, server_name, icon, name, args)

                result_text, ok = await _execute_tool_with_healing(
                    session, server_name, name, args, step_num, route_id, stream
                )

                steps_executed.append({
                    "step": step_num,
                    "server": server_name,
                    "server_icon": icon,
                    "tool": name,
                    "args": args,
                    "result": result_text[:1000],
                    "success": ok,
                })
                step_num += 1

            # Single LLM synthesis call for the entire flight
            step_lines = []
            for s in steps_executed:
                status_badge = "PASSED" if s["success"] else "FAILED"
                step_lines.append(f"Step {s['step']} [{s['tool']}] ({status_badge}):\n{s['result'][:800]}")

            summary_prompt = (
                f"Execution of the planned route steps is complete.\n\n"
                f"Original User Request:\n{route['prompt']}\n\n"
                f"Executed Steps & Results:\n" + "\n\n".join(step_lines) + "\n\n"
                f"Provide a clear, helpful final response answering the original request based on these results."
            )

            synth_messages = [
                {"role": "system", "content": EXECUTION_PROMPT},
                {"role": "user", "content": summary_prompt},
            ]

            response = await chat_completion_with_retry(
                client,
                model=LLM_MODEL,
                messages=synth_messages,
                temperature=LLM_TEMPERATURE,
                top_p=LLM_TOP_P,
                max_tokens=LLM_MAX_TOKENS,
                stream=False,
                extra_body=llm_extra_body(),
            )
            assistant_text = extract_text_content(getattr(response.choices[0].message, "content", "")).strip()
            final_summary = await generate_flight_summary(client, synth_messages, assistant_text, stream)

            payload = save_flight_record(
                route_id, route["prompt"], route, steps_executed, "completed", final_summary
            )
            await write_log("INFO", "agent", "flight_complete", {"route_id": route_id, "steps": len(steps_executed), "mode": "plan_guided"})
            if stream:
                stream.finish(final_summary)
            return payload

        # PATH B: Dynamic ReAct (Bounded to max 8 steps to prevent quota exhaustion)
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": EXECUTION_PROMPT},
            {"role": "user", "content": route["prompt"]},
        ]
        max_steps = 8

        while step_num <= max_steps:
            response = await chat_completion_with_retry(
                client,
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
                dump = msg.model_dump(exclude_none=True)
                if not dump.get("content"):
                    dump["content"] = ""
                messages.append(dump)
                for tool_call in tool_calls:
                    name = tool_call.function.name
                    raw_args = tool_call.function.arguments or "{}"
                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else {}
                    except Exception:
                        args = {}

                    session, server_name = tool_router.get(name, (None, "unknown"))
                    icon = SERVER_ICONS.get(server_name, "🔧")

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

                    steps_executed.append({
                        "step": step_num,
                        "server": server_name,
                        "server_icon": icon,
                        "tool": name,
                        "args": args,
                        "result": result_text[:500],
                        "success": ok,
                    })

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
                            result_text += f"\n\n[SELF-HEAL]: Step failed. Diagnose error and fix."

                    # Truncate content in message history to conserve tokens and prevent quota blowout
                    messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result_text[:1200]})
                    step_num += 1
                    if step_num > max_steps:
                        break
                continue

            assistant_text = extract_text_content(getattr(msg, "content", "")).strip()
            final_summary = await generate_flight_summary(client, messages, assistant_text, stream)

            payload = save_flight_record(
                route_id, route["prompt"], route, steps_executed, "completed", final_summary
            )
            await write_log("INFO", "agent", "flight_complete", {"route_id": route_id, "steps": len(steps_executed), "mode": "react"})

            if stream:
                stream.finish(final_summary)
            return payload

    except Exception as error:
        save_flight_record(route_id, route["prompt"], route, steps_executed, "failed", error=str(error))
        if stream:
            stream.finish_error(str(error))
        raise

    summary = "Completed flight after executing planned tool actions."
    payload = save_flight_record(route_id, route["prompt"], route, steps_executed, "completed", summary)
    if stream:
        stream.finish(summary)
    return payload
