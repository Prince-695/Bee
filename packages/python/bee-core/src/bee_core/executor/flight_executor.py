from __future__ import annotations

import json
from typing import Any

from bee_core.config import (
    LLM_MAX_TOKENS,
    LLM_MODEL,
    LLM_TEMPERATURE,
    LLM_TOP_P,
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


async def execute_flight(route_id: str) -> dict[str, Any]:
    """Execute an approved Route (a Flight). Streams events via SSE if present."""
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

    print(f"\n{'─' * 55}")
    print(f"▶️  Flight for route [{route_id}]")
    print(f"{'─' * 55}\n")

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
    max_steps = 25

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
                        args = json.loads(raw_args)
                        if not isinstance(args, dict):
                            args = {}
                    except Exception:
                        args = {}

                    session, server_name = tool_router.get(name, (None, "unknown"))
                    icon = SERVER_ICONS.get(server_name, "🔧")

                    print(f"{icon} Step {step_num}: [{server_name}] → {name}")
                    print(f"   └─ Args: {json.dumps(args, indent=6)}")

                    await write_log(
                        "INFO",
                        "agent",
                        "tool_call",
                        {
                            "route_id": route_id,
                            "step": step_num,
                            "server": server_name,
                            "tool": name,
                        },
                    )

                    if stream:
                        stream.push_step_start(
                            step_num, server_name, icon, name, args
                        )

                    if not session:
                        result_text = f"Unknown tool: {name}"
                        print(f"   └─ ⚠️ {result_text}\n")
                        if stream:
                            stream.push_step_error(step_num, result_text)
                    else:
                        try:
                            result = await session.call_tool(name, args)
                            result_text = format_tool_result(result)
                        except Exception as error:
                            detail = str(error).strip() or repr(error)
                            result_text = (
                                f"Tool error ({type(error).__name__}): {detail}"
                            )

                        print(f"   └─ Result: {result_text[:300]}\n")

                        if stream:
                            if result_text.startswith("Tool error") or result_text.startswith(
                                "Tool returned error"
                            ):
                                stream.push_step_error(step_num, result_text[:500])
                            else:
                                stream.push_step_complete(step_num, result_text[:500])

                    steps_executed.append(
                        {
                            "step": step_num,
                            "server": server_name,
                            "server_icon": icon,
                            "tool": name,
                            "args": args,
                            "result": result_text[:500],
                        }
                    )

                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": result_text,
                        }
                    )
                    step_num += 1
                    if step_num > max_steps:
                        break
                continue

            assistant_text = extract_text_content(
                getattr(msg, "content", "")
            ).strip()

            print("🤖 Bee: ", end="", flush=True)

            try:
                summary_stream = client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=messages[:-1]
                    + [
                        {
                            "role": "user",
                            "content": "Summarize what you just did concisely.",
                        }
                    ],
                    temperature=LLM_TEMPERATURE,
                    top_p=LLM_TOP_P,
                    max_tokens=2048,
                    stream=True,
                    extra_body=llm_extra_body(),
                )

                summary_tokens: list[str] = []
                for chunk in summary_stream:
                    if getattr(chunk, "choices", None) and chunk.choices[
                        0
                    ].delta.content is not None:
                        token = chunk.choices[0].delta.content
                        summary_tokens.append(token)
                        print(token, end="", flush=True)
                        if stream:
                            stream.push_token(token)

                print()
                final_summary = "".join(summary_tokens).strip()
                if not final_summary:
                    final_summary = assistant_text
            except Exception:
                final_summary = assistant_text
                print(final_summary)

            route["status"] = "completed"

            result_payload = {
                "route_id": route_id,
                "assistant_response": final_summary,
                "steps": steps_executed,
                "tool_step_count": len(steps_executed),
            }
            save_chat(
                prompt=route["prompt"],
                route=route,
                result=result_payload,
                status="completed",
                chat_id=route_id,
                route_id=route_id,
            )

            await write_log(
                "INFO",
                "agent",
                "flight_complete",
                {
                    "route_id": route_id,
                    "steps": len(steps_executed),
                    "response_length": len(final_summary),
                },
            )

            print(f"\n✅ Done — {len(steps_executed)} steps executed.\n")

            if stream:
                stream.finish(final_summary)

            return result_payload
    except Exception as error:
        route["status"] = "failed"
        save_chat(
            prompt=route["prompt"],
            route=route,
            result={"error": str(error), "steps": steps_executed},
            status="failed",
            chat_id=route_id,
            route_id=route_id,
        )
        if stream:
            stream.finish_error(str(error))
        raise

    route["status"] = "completed"
    summary = "Stopped after reaching maximum tool steps."
    result_payload = {
        "route_id": route_id,
        "assistant_response": summary,
        "steps": steps_executed,
        "tool_step_count": len(steps_executed),
    }
    save_chat(
        prompt=route["prompt"],
        route=route,
        result=result_payload,
        status="completed",
        chat_id=route_id,
        route_id=route_id,
    )
    if stream:
        stream.finish(summary)

    return result_payload
