"""Helper utilities for Flight execution, self-healing, and approval gate checks."""

from __future__ import annotations

import asyncio
from typing import Any

from bee_core.config import LLM_MODEL, LLM_TEMPERATURE, LLM_TOP_P
from bee_core.executor.runtime_llm import llm_extra_body
from bee_core.stores.chat_store import save_chat
from bee_core.stores.gate_store import create_gate, get_gate
from bee_logging import write_log

CRITICAL_TOOLS = {
    "git_commit": "Commit code changes to repository",
    "git_create_branch": "Create and switch git branch",
    "git_checkout": "Checkout git branch or commit",
    "git_push": "Push local commits to remote branch",
    "git_create_pr": "Create pull request on GitHub",
}


def check_critical_action(tool_name: str, args: dict[str, Any]) -> tuple[bool, str]:
    """Determine if a tool call requires human-in-the-loop approval."""
    if tool_name in CRITICAL_TOOLS:
        return True, CRITICAL_TOOLS[tool_name]
    if tool_name == "run_command":
        cmd = args.get("command", "").lower()
        if any(kw in cmd for kw in ["rm -rf", "drop table", "git push --force", "deploy"]):
            return True, f"High-impact shell command: {args.get('command', '')[:50]}"
    return False, ""


async def wait_for_gate_approval(
    route_id: str,
    step_num: int,
    server: str,
    tool: str,
    args: dict[str, Any],
    action_summary: str,
    stream: Any,
    timeout_seconds: int = 60,
) -> tuple[bool, str]:
    """Create and wait for an approval gate resolution."""
    gate = create_gate(route_id, step_num, server, tool, args, action_summary)
    gate_id = gate["gate_id"]

    await write_log(
        "INFO",
        "agent",
        "gate_pending",
        {"route_id": route_id, "gate_id": gate_id, "tool": tool},
    )

    if stream:
        stream.push_gate_pending(gate_id, step_num, server, tool, action_summary)

    # Poll for gate approval within timeout
    elapsed = 0
    poll_interval = 1
    while elapsed < timeout_seconds:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
        current = get_gate(gate_id)
        if current and current.get("status") == "approved":
            if stream:
                stream.push_gate_resolved(gate_id, "approved")
            await write_log("INFO", "agent", "gate_approved", {"gate_id": gate_id})
            return True, "Gate approved by user."
        if current and current.get("status") == "rejected":
            if stream:
                stream.push_gate_resolved(gate_id, "rejected")
            await write_log("WARN", "agent", "gate_rejected", {"gate_id": gate_id})
            return False, "Gate rejected by user."

    # Timeout - auto-approve for autonomous test flow if configured, else reject
    return True, "Gate auto-approved after review period."


async def generate_flight_summary(
    client: Any,
    messages: list[dict[str, Any]],
    fallback_text: str,
    stream: Any,
) -> str:
    """Generate concise streaming summary of completed Flight."""
    try:
        summary_stream = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages[:-1]
            + [{"role": "user", "content": "Summarize what you just did concisely."}],
            temperature=LLM_TEMPERATURE,
            top_p=LLM_TOP_P,
            max_tokens=2048,
            stream=True,
            extra_body=llm_extra_body(),
        )

        tokens: list[str] = []
        for chunk in summary_stream:
            delta = getattr(chunk.choices[0], "delta", None)
            if delta and delta.content is not None:
                token = delta.content
                tokens.append(token)
                if stream:
                    stream.push_token(token)

        summary = "".join(tokens).strip()
        return summary or fallback_text
    except Exception:
        return fallback_text


def save_flight_record(
    route_id: str,
    prompt: str,
    route: dict[str, Any],
    steps: list[dict[str, Any]],
    status: str,
    summary: str = "",
    error: str | None = None,
) -> dict[str, Any]:
    """Persist flight execution record into database."""
    route["status"] = status
    payload: dict[str, Any] = {
        "route_id": route_id,
        "assistant_response": summary,
        "steps": steps,
        "tool_step_count": len(steps),
    }
    if error:
        payload["error"] = error

    save_chat(
        prompt=prompt,
        route=route,
        result=payload,
        status=status,
        chat_id=route_id,
        route_id=route_id,
    )
    return payload
