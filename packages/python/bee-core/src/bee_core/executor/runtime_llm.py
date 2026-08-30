from __future__ import annotations

import json
from typing import Any, Optional

from openai import OpenAI

from bee_core.config import (
    LLM_API_KEY,
    LLM_BASE_URL,
    LLM_ENABLE_THINKING,
    LLM_REASONING_BUDGET,
)

_client: Optional[OpenAI] = None


def llm_extra_body() -> dict[str, Any]:
    if not LLM_ENABLE_THINKING:
        return {}
    return {
        "chat_template_kwargs": {"enable_thinking": LLM_ENABLE_THINKING},
        "reasoning_budget": LLM_REASONING_BUDGET,
    }


DEFAULT_MANAGED_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MANAGED_KEY_FALLBACK = "nvapi-managed-starter-gateway"


def get_llm_status() -> dict[str, Any]:
    is_custom = bool(LLM_API_KEY and LLM_API_KEY != DEFAULT_MANAGED_KEY_FALLBACK)
    return {
        "tier": "custom_byok" if is_custom else "managed_cloud_starter",
        "base_url": LLM_BASE_URL or DEFAULT_MANAGED_BASE_URL,
        "is_zero_config": not is_custom,
    }


def get_client() -> OpenAI:
    global _client
    if _client is not None:
        return _client
    api_key = LLM_API_KEY or DEFAULT_MANAGED_KEY_FALLBACK
    base_url = LLM_BASE_URL or DEFAULT_MANAGED_BASE_URL
    _client = OpenAI(base_url=base_url, api_key=api_key)
    return _client


def reset_client() -> None:
    global _client
    _client = None


def extract_text_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: list[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str) and text:
                    chunks.append(text)
            else:
                text = getattr(item, "text", None)
                if isinstance(text, str) and text:
                    chunks.append(text)
        return "\n".join(chunks)
    return str(content)


def format_tool_result(result: Any) -> str:
    content_blocks = getattr(result, "content", None) or []
    if not content_blocks:
        return "Done"

    chunks: list[str] = []
    for block in content_blocks:
        text = getattr(block, "text", None)
        if text:
            chunks.append(text)
            continue
        try:
            chunks.append(json.dumps(block.model_dump(), ensure_ascii=False))
        except Exception:
            chunks.append(str(block))

    rendered = "\n".join(chunks).strip() or "Done"
    if getattr(result, "isError", False):
        return f"Tool returned error: {rendered}"
    return rendered


def parse_route_json(raw_text: str) -> dict[str, Any] | None:
    """Extract JSON route from LLM response, handling markdown fences."""
    text = raw_text.strip()

    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2 and lines[-1].strip() == "```":
            text = "\n".join(lines[1:-1]).strip()
        else:
            text = text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "steps" in parsed:
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(text)):
        char = text[i]
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
                try:
                    parsed = json.loads(text[start : i + 1])
                    if isinstance(parsed, dict) and "steps" in parsed:
                        return parsed
                except json.JSONDecodeError:
                    pass
                break

    return None
