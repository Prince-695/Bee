from __future__ import annotations

import json
from typing import Any

from bee_core.config import LLM_MODEL
from bee_hive.registry import MCP_SERVERS
from services.agent_runtime.agent_runtime import runtime_status
from bee_core.executor.hive_runtime import ensure_runtime
from services.agent_runtime.runtime_llm import (
    chat_completion_with_retry,
    extract_text_content,
    get_client,
    llm_extra_body,
)

GATHER_PROMPT = """You are Bee's requirement-gathering assistant.

Your job is to talk with the user until you have enough information to build a Route.

Rules:
- Do not create a plan yet unless the user is sufficiently clear.
- Ask 1 to 2 direct questions at a time.
- Prefer short, specific follow-up questions.
- Collect the real goal, target system, constraints, success criteria, and any timing or access details that matter.
- When enough detail exists, set can_proceed to true and provide a concise planning_prompt that preserves the user's intent.
- Keep the tone conversational and practical.

Return ONLY valid JSON in this exact shape:
{
  "assistant_message": "A concise reply or clarifying question",
  "can_proceed": false,
  "missing_info": ["what is still missing"],
  "requirement_summary": "A concise summary of what the user wants",
  "planning_prompt": null
}
"""


def _strip_fences(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2 and lines[-1].strip() == "```":
            return "\n".join(lines[1:-1]).strip()
        return text.replace("```json", "").replace("```", "").strip()
    return text


def _parse_json_object(raw_text: str) -> dict[str, Any] | None:
    text = _strip_fences(raw_text)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:index + 1]
                try:
                    parsed = json.loads(candidate)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    return None
    return None


def _build_runtime_context() -> dict[str, Any]:
    status = runtime_status()
    return {
        "runtime": status,
        "servers": list(MCP_SERVERS.keys()),
        "server_count": len(MCP_SERVERS),
    }


def _build_gather_messages(session: dict[str, Any]) -> list[dict[str, Any]]:
    transcript_lines = []
    for message in session.get("messages", []):
        role = message.get("role", "unknown")
        content = message.get("content", "")
        transcript_lines.append(f"{role.upper()}: {content}")

    transcript = "\n".join(transcript_lines).strip() or session.get("initial_prompt", "")
    context = json.dumps(_build_runtime_context(), ensure_ascii=False, indent=2)

    return [
        {"role": "system", "content": GATHER_PROMPT + f"\n\nRuntime context:\n{context}"},
        {"role": "user", "content": f"Conversation so far:\n{transcript}"},
    ]


def _default_gather_response(session: dict[str, Any]) -> dict[str, Any]:
    prompt = session.get("initial_prompt", "Tell me what problem you're trying to solve.")
    return {
        "assistant_message": "Tell me a bit more about the problem, the system it affects, and what outcome you want.",
        "can_proceed": False,
        "missing_info": ["goal", "affected system", "success criteria"],
        "requirement_summary": prompt,
        "planning_prompt": None,
    }


async def gather_requirements(session: dict[str, Any]) -> dict[str, Any]:
    prompt = session.get("initial_prompt") or ""
    if not prompt and session.get("messages"):
        for m in reversed(session.get("messages", [])):
            if m.get("role") == "user" and m.get("content"):
                prompt = m["content"]
                break

    prompt_words = prompt.strip().split()
    action_keywords = {
        "run", "test", "tests", "pytest", "build", "fix", "deploy", "check",
        "create", "add", "update", "delete", "remove", "install", "inspect",
        "find", "list", "explain", "show", "git", "python", "pnpm", "npm",
        "debug", "make", "docker", "migrate", "verify", "lint"
    }
    has_action = any(w.lower().strip(",.:;!?") in action_keywords for w in prompt_words)
    has_code_or_path = any(x in prompt for x in [".py", ".ts", ".tsx", ".js", ".json", "/", "\\", "http", "api"])

    # Fast-path: If prompt is actionable or sufficiently detailed, skip LLM call
    if (len(prompt_words) >= 5 and (has_action or has_code_or_path)) or len(prompt_words) >= 12:
        return {
            "assistant_message": "Requirement clarified. Proceeding to route planning.",
            "can_proceed": True,
            "missing_info": [],
            "requirement_summary": prompt.strip(),
            "planning_prompt": prompt.strip(),
        }

    await ensure_runtime()
    messages = _build_gather_messages(session)
    client = get_client()
    response = await chat_completion_with_retry(
        client,
        model=LLM_MODEL,
        messages=messages,
        temperature=0.2,
        top_p=0.9,
        max_tokens=1024,
        stream=False,
        extra_body=llm_extra_body(),
    )

    raw_text = extract_text_content(getattr(response.choices[0].message, "content", ""))
    parsed = _parse_json_object(raw_text) or _default_gather_response(session)

    assistant_message = str(parsed.get("assistant_message") or "").strip()
    if not assistant_message:
        assistant_message = _default_gather_response(session)["assistant_message"]

    missing_info = parsed.get("missing_info")
    if not isinstance(missing_info, list):
        missing_info = []

    return {
        "assistant_message": assistant_message,
        "can_proceed": bool(parsed.get("can_proceed")),
        "missing_info": [str(item) for item in missing_info if str(item).strip()],
        "requirement_summary": str(parsed.get("requirement_summary") or session.get("initial_prompt", "")).strip(),
        "planning_prompt": parsed.get("planning_prompt"),
    }