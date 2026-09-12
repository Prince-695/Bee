from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from bee_core.executor.conversation_gather import gather_requirements
from bee_core.executor.runtime_llm import resolve_model_name


@pytest.mark.anyio
async def test_fast_path_gather_skips_llm():
    """Actionable prompts should proceed immediately without invoking LLM."""
    session = {
        "initial_prompt": "Run pytest on apps/api/tests/test_auth_v1.py and check output",
        "messages": [],
    }
    # If LLM was called, it would attempt network/runtime
    result = await gather_requirements(session)
    assert result["can_proceed"] is True
    assert "pytest" in result["requirement_summary"]
    assert result["missing_info"] == []


@pytest.mark.anyio
async def test_gather_vague_prompt_calls_runtime():
    """Vague prompt uses normal gather flow."""
    session = {
        "initial_prompt": "hello",
        "messages": [],
    }
    with patch("bee_core.executor.conversation_gather.chat_completion_with_retry", new=AsyncMock()) as mock_llm:
        mock_resp = MagicMock()
        mock_resp.choices = [MagicMock(message=MagicMock(content='{"can_proceed": false, "assistant_message": "Tell me more"}'))]
        mock_llm.return_value = mock_resp

        result = await gather_requirements(session)
        assert mock_llm.called
        assert result["can_proceed"] is False


def test_resolve_model_name_stable_mapping():
    """Ensure deprecated or preview models resolve safely."""
    assert resolve_model_name("gemini-2.5-flash") == "gemini-2.5-flash"
    assert resolve_model_name("openai/gpt-4o") == "openai/gpt-4o"
