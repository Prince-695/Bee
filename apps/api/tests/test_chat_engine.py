"""Unit & Integration Tests for Phase 3: Chat-First Personal Worker Surface."""

from __future__ import annotations

import os
import pytest
from httpx import ASGITransport, AsyncClient

from bee_api.main import app
from services.chat.engine import ChatEngine
from services.chat.models import (
    ChatMessage,
    ChatStreamEventType,
    ChatThread,
    SenderType,
)
from services.chat.runner import EphemeralWorkerRunner
from services.data.database import DatabaseEngine
from services.data.repositories.chat_repo import ChatRepository
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import MemoryRecord, MemoryScope, MemoryType
from services.memory.retriever import HybridRetriever
from services.memory.semantic_memory import SemanticMemoryEngine


@pytest.fixture
def temp_chat_db(tmp_path):
    db_file = str(tmp_path / "test_chat.db")
    db = DatabaseEngine(database_url=None, sqlite_path=db_file)
    return db


@pytest.mark.anyio
async def test_chat_repo_thread_and_messages(temp_chat_db):
    await temp_chat_db.init_db()
    repo = ChatRepository(db=temp_chat_db)

    # 1. Create thread
    thread = ChatThread(
        title="Test Universal Chat",
        worker_id=None,
        project_id="proj-123",
    )
    saved_thread = await repo.create_thread(thread)
    assert saved_thread.id == thread.id
    assert saved_thread.title == "Test Universal Chat"

    # 2. Get thread
    fetched = await repo.get_thread(thread.id)
    assert fetched is not None
    assert fetched.project_id == "proj-123"

    # 3. Save messages
    msg1 = ChatMessage(
        thread_id=thread.id,
        sender_type=SenderType.USER,
        sender_id="user-1",
        content="Hello, Bee!",
    )
    await repo.save_message(msg1)

    msg2 = ChatMessage(
        thread_id=thread.id,
        sender_type=SenderType.WORKER,
        sender_id="bee-orchestrator",
        content="Hello! How can I assist you?",
    )
    await repo.save_message(msg2)

    # 4. List messages
    msgs = await repo.get_messages(thread.id)
    assert len(msgs) == 2
    assert msgs[0].content == "Hello, Bee!"
    assert msgs[1].content == "Hello! How can I assist you?"

    # 5. List threads with filter
    threads = await repo.list_threads(project_id="proj-123")
    assert len(threads) == 1

    # 6. Delete thread
    deleted = await repo.delete_thread(thread.id)
    assert deleted is True
    assert await repo.get_thread(thread.id) is None


@pytest.mark.anyio
async def test_chat_engine_context_injection_and_preference(temp_chat_db):
    await temp_chat_db.init_db()
    chat_repo = ChatRepository(db=temp_chat_db)
    mem_repo = MemoryRepository(db=temp_chat_db)

    # Pre-seed a memory in the context graph
    seed_mem = MemoryRecord(
        tenant_id="default",
        user_id="user-1",
        type=MemoryType.SEMANTIC,
        scope=MemoryScope.USER,
        title="Testing Convention",
        content="Always use anyio and pytest for async testing in Bee",
        tags=["testing", "convention"],
    )
    await mem_repo.create_memory(seed_mem)

    retriever = HybridRetriever(memory_repo=mem_repo)
    semantic_engine = SemanticMemoryEngine(memory_repo=mem_repo, retriever=retriever)
    engine = ChatEngine(chat_repo=chat_repo, retriever=retriever, semantic_engine=semantic_engine)

    # 1. Start a thread
    thread = await engine.get_or_create_thread(title="Coding Chat", user_id="user-1")

    # 2. Send prompt mentioning testing
    reply = await engine.send_message(
        thread_id=thread.id,
        content="How should we write async tests for this module? Remember that our rule is always write clean code",
        user_id="user-1",
    )
    assert reply.sender_type == SenderType.WORKER
    assert "Bee Orchestrator" in reply.content
    assert len(reply.recalled_memory_ids) > 0
    assert seed_mem.id in reply.recalled_memory_ids

    # 3. Check that user preference was distilled into memory
    memories = await mem_repo.list_memories(tenant_id="default", scope="user")
    pref_titles = [m.title for m in memories]
    assert any("Preference" in t or "Testing" in t for t in pref_titles)


@pytest.mark.anyio
async def test_chat_ephemeral_runner_guardrails():
    runner = EphemeralWorkerRunner()

    # 1. FileGuard blocked attempt on .env
    blocked_res = await runner.execute_tool(
        worker_id="scout",
        tool="read_file",
        args={"path": "/workspace/.env"},
    )
    assert blocked_res["status"] == "error"
    assert blocked_res["error_type"] == "SECURITY_VIOLATION"
    assert "FileGuard blocked" in blocked_res["error"]

    # 2. Safe read_file tool execution
    safe_res = await runner.execute_tool(
        worker_id="scout",
        tool="read_file",
        args={"path": "README.md"},
    )
    assert safe_res["status"] == "success"
    assert "output" in safe_res

    # 3. Web_search tool execution (evaluates against policy)
    search_res = await runner.execute_tool(
        worker_id="scout",
        tool="web_search",
        args={"query": "FastAPI SSE streaming"},
    )
    assert search_res["status"] in ("success", "gate_requested")


@pytest.mark.anyio
async def test_chat_api_endpoints_integration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create thread via POST /v1/chat/threads
        create_res = await client.post(
            "/v1/chat/threads",
            json={"title": "API Test Thread", "worker_id": None},
        )
        assert create_res.status_code == 201
        data = create_res.json()["data"]
        thread_id = data["id"]
        assert data["title"] == "API Test Thread"

        # 2. List threads via GET /v1/chat/threads
        list_res = await client.get("/v1/chat/threads")
        assert list_res.status_code == 200
        threads = list_res.json()["data"]["threads"]
        assert any(t["id"] == thread_id for t in threads)

        # 3. Send message via POST /v1/chat/threads/{id}/messages
        msg_res = await client.post(
            f"/v1/chat/threads/{thread_id}/messages",
            json={"content": "Hello Bee, what is your role?"},
        )
        assert msg_res.status_code == 200
        reply = msg_res.json()["data"]
        assert reply["sender_type"] == "worker"
        assert "Bee Orchestrator" in reply["content"]

        # 4. Get message history via GET /v1/chat/threads/{id}/messages
        hist_res = await client.get(f"/v1/chat/threads/{thread_id}/messages")
        assert hist_res.status_code == 200
        messages = hist_res.json()["data"]["messages"]
        assert len(messages) >= 2

        # 5. Delete thread via DELETE /v1/chat/threads/{id}
        del_res = await client.delete(f"/v1/chat/threads/{thread_id}")
        assert del_res.status_code == 200
        assert del_res.json()["data"]["deleted"] is True
