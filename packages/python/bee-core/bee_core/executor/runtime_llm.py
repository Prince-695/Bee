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


import asyncio

def llm_extra_body() -> dict[str, Any]:
    if not LLM_ENABLE_THINKING:
        return {}
    if LLM_BASE_URL and "nvidia" in LLM_BASE_URL.lower():
        return {
            "chat_template_kwargs": {"enable_thinking": LLM_ENABLE_THINKING},
            "reasoning_budget": LLM_REASONING_BUDGET,
        }
    return {}


def resolve_model_name(model: str) -> str:
    """Map deprecated preview model aliases to active stable models."""
    if model == "gemini-3.5-flash" and "googleapis.com" in (LLM_BASE_URL or ""):
        return "gemini-2.5-flash"
    return model


import re

async def chat_completion_with_retry(
    client: OpenAI,
    **kwargs: Any,
) -> Any:
    """Execute chat completion with automatic retry on 503 (high demand) or 429 (rate limits)."""
    if "model" in kwargs:
        kwargs["model"] = resolve_model_name(kwargs["model"])
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return await asyncio.to_thread(client.chat.completions.create, **kwargs)
        except Exception as err:
            err_msg = str(err)
            is_transient = any(
                code in err_msg
                for code in ["503", "429", "high demand", "temporarily unavailable", "RESOURCE_EXHAUSTED"]
            )
            if is_transient and attempt < max_retries - 1:
                # If daily quota limit exceeded on preview model, fallback to standard flash
                if "Quota exceeded" in err_msg and "3.6" in str(kwargs.get("model", "")):
                    kwargs["model"] = "gemini-2.5-flash"
                    continue

                match = re.search(r"retry in ([\d\.]+)", err_msg) or re.search(r"retryDelay.*?(\d+)", err_msg)
                if match:
                    wait_secs = min(float(match.group(1)) + 1.5, 60.0)
                else:
                    wait_secs = 5.0 * (attempt + 1)
                await asyncio.sleep(wait_secs)
                continue
            raise





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
