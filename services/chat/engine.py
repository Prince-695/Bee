"""Worker Chat Engine: Context Injection, Persona Resolution, and Streaming Generation."""

from __future__ import annotations

import asyncio
import os
import re
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from services.chat.models import (
    ChatMessage,
    ChatStreamEvent,
    ChatStreamEventType,
    ChatThread,
    SenderType,
    _utc_now_iso,
)
from services.chat.runner import EphemeralWorkerRunner
from services.data.repositories.chat_repo import ChatRepository
from services.agent_runtime.worker import WorkerDefinition, WorkerManager
from services.memory.models import MemoryScope, MemoryType
from services.memory.retriever import HybridRetriever
from services.memory.semantic_memory import SemanticMemoryEngine


class ChatEngine:
    """Core chat service handling Universal and 1:1 Worker conversations with dynamic memory graph injection."""

    def __init__(
        self,
        chat_repo: Optional[ChatRepository] = None,
        worker_manager: Optional[WorkerManager] = None,
        retriever: Optional[HybridRetriever] = None,
        semantic_engine: Optional[SemanticMemoryEngine] = None,
        ephemeral_runner: Optional[EphemeralWorkerRunner] = None,
    ):
        self.chat_repo = chat_repo or ChatRepository()
        self.worker_manager = worker_manager or WorkerManager()
        self.retriever = retriever or HybridRetriever()
        self.semantic_engine = semantic_engine or SemanticMemoryEngine(retriever=self.retriever)
        self.ephemeral_runner = ephemeral_runner or EphemeralWorkerRunner()

    async def get_or_create_thread(
        self,
        thread_id: Optional[str] = None,
        worker_id: Optional[str] = None,
        project_id: Optional[str] = None,
        title: Optional[str] = None,
        tenant_id: str = "default",
        user_id: str = "default-user",
    ) -> ChatThread:
        """Retrieves existing thread or creates a new one."""
        if thread_id:
            existing = await self.chat_repo.get_thread(thread_id, tenant_id=tenant_id)
            if existing:
                return existing

        target_title = title or ("Universal Chat" if not worker_id else f"Chat with {worker_id}")
        thread = ChatThread(
            tenant_id=tenant_id,
            user_id=user_id,
            project_id=project_id,
            worker_id=worker_id,
            title=target_title,
        )
        return await self.chat_repo.create_thread(thread)

    async def send_message(
        self,
        thread_id: str,
        content: str,
        tenant_id: str = "default",
        user_id: str = "default-user",
    ) -> ChatMessage:
        """Handles a conversational turn: user prompt -> context injection -> worker response."""
        thread = await self.chat_repo.get_thread(thread_id, tenant_id=tenant_id)
        if not thread:
            thread = await self.get_or_create_thread(
                thread_id=thread_id,
                tenant_id=tenant_id,
                user_id=user_id,
            )

        # 1. Store User Message
        user_msg = ChatMessage(
            tenant_id=tenant_id,
            thread_id=thread_id,
            sender_type=SenderType.USER,
            sender_id=user_id,
            content=content,
        )
        await self.chat_repo.save_message(user_msg)

        # 2. Resolve Worker Persona
        worker = self._resolve_worker(thread.worker_id)

        # 3. Recall Memories from Context Graph
        recalled_memories, recalled_ids = await self._recall_context(
            tenant_id=tenant_id,
            query=content,
            worker_id=thread.worker_id,
            project_id=thread.project_id,
        )

        # 4. Asynchronously Distill User Preferences/Rules into Semantic Memory
        await self._distill_preferences_if_present(
            tenant_id=tenant_id,
            user_id=user_id,
            project_id=thread.project_id,
            content=content,
        )

        # 5. Check for Action Commands or Ephemeral Tool Execution
        tool_invocations: List[Dict[str, Any]] = []
        gate_id: Optional[str] = None
        tool_action = self._detect_tool_intent(content)
        if tool_action:
            tool_name, tool_args = tool_action
            run_res = await self.ephemeral_runner.execute_tool(
                worker_id=worker.id,
                tool=tool_name,
                args=tool_args,
                thread_id=thread_id,
            )
            tool_invocations.append({
                "tool": tool_name,
                "args": tool_args,
                "result": run_res,
            })
            if run_res.get("status") == "gate_requested":
                gate_id = run_res.get("gate_id")

        # 6. Generate Assistant Response
        assistant_content = self._generate_response(
            worker=worker,
            user_content=content,
            recalled_memories=recalled_memories,
            tool_invocations=tool_invocations,
            gate_id=gate_id,
        )

        # 7. Store Assistant Message
        assistant_msg = ChatMessage(
            tenant_id=tenant_id,
            thread_id=thread_id,
            sender_type=SenderType.WORKER,
            sender_id=worker.id,
            content=assistant_content,
            recalled_memory_ids=recalled_ids,
            tool_invocations=tool_invocations,
            gate_id=gate_id,
            metadata={"model": worker.model, "worker_name": worker.name, "role": worker.role},
        )
        return await self.chat_repo.save_message(assistant_msg)

    async def stream_message(
        self,
        thread_id: str,
        content: str,
        tenant_id: str = "default",
        user_id: str = "default-user",
    ) -> AsyncGenerator[ChatStreamEvent, None]:
        """Streams assistant response chunks, memory citations, and tool progress over SSE."""
        thread = await self.chat_repo.get_thread(thread_id, tenant_id=tenant_id)
        if not thread:
            thread = await self.get_or_create_thread(
                thread_id=thread_id,
                tenant_id=tenant_id,
                user_id=user_id,
            )

        # 1. Save user message
        user_msg = ChatMessage(
            tenant_id=tenant_id,
            thread_id=thread_id,
            sender_type=SenderType.USER,
            sender_id=user_id,
            content=content,
        )
        await self.chat_repo.save_message(user_msg)

        # 2. Worker resolution & memory search
        worker = self._resolve_worker(thread.worker_id)
        recalled_memories, recalled_ids = await self._recall_context(
            tenant_id=tenant_id,
            query=content,
            worker_id=thread.worker_id,
            project_id=thread.project_id,
        )

        # Yield memory citation event if memories recalled
        if recalled_ids:
            yield ChatStreamEvent(
                event=ChatStreamEventType.MEMORY_CITATION,
                data={"memory_ids": recalled_ids, "citations": [m.title for m in recalled_memories]},
            )

        # 3. Tool execution if present
        tool_invocations: List[Dict[str, Any]] = []
        gate_id: Optional[str] = None
        tool_action = self._detect_tool_intent(content)
        if tool_action:
            tool_name, tool_args = tool_action
            yield ChatStreamEvent(
                event=ChatStreamEventType.TOOL_START,
                data={"tool": tool_name, "args": tool_args},
            )
            run_res = await self.ephemeral_runner.execute_tool(
                worker_id=worker.id,
                tool=tool_name,
                args=tool_args,
                thread_id=thread_id,
            )
            tool_invocations.append({"tool": tool_name, "args": tool_args, "result": run_res})
            if run_res.get("status") == "gate_requested":
                gate_id = run_res.get("gate_id")
                yield ChatStreamEvent(
                    event=ChatStreamEventType.GATE_REQUESTED,
                    data={"gate_id": gate_id, "risk_level": run_res.get("risk_level"), "reason": run_res.get("reason")},
                )
            yield ChatStreamEvent(
                event=ChatStreamEventType.TOOL_END,
                data={"tool": tool_name, "result": run_res},
            )

        # 4. Generate response content
        full_text = self._generate_response(
            worker=worker,
            user_content=content,
            recalled_memories=recalled_memories,
            tool_invocations=tool_invocations,
            gate_id=gate_id,
        )

        # Stream chunks
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i : i + 3]) + " "
            yield ChatStreamEvent(
                event=ChatStreamEventType.CHUNK,
                data={"text": chunk},
            )
            await asyncio.sleep(0.01)

        # 5. Persist final assistant message
        assistant_msg = ChatMessage(
            tenant_id=tenant_id,
            thread_id=thread_id,
            sender_type=SenderType.WORKER,
            sender_id=worker.id,
            content=full_text,
            recalled_memory_ids=recalled_ids,
            tool_invocations=tool_invocations,
            gate_id=gate_id,
            metadata={"model": worker.model, "worker_name": worker.name, "role": worker.role},
        )
        saved = await self.chat_repo.save_message(assistant_msg)

        yield ChatStreamEvent(
            event=ChatStreamEventType.DONE,
            data={"message": saved.model_dump()},
        )

    # ─── Internal Helpers ───

    def _resolve_worker(self, worker_id: Optional[str]) -> WorkerDefinition:
        """Finds specific worker or defaults to Bee Lead Orchestrator."""
        if worker_id:
            worker = self.worker_manager.get_worker(worker_id)
            if worker:
                return worker

        return WorkerDefinition(
            id="bee-orchestrator",
            name="Bee Orchestrator",
            role="Lead Engineering Orchestrator",
            description="Autonomous multi-worker coordinator and lead software engineer.",
            avatar="Bot",
            persona_prompt="You are Bee, an autonomous multi-worker co-engineering platform. You plan architectures, coordinate worker swarms, inspect context, and execute work safely.",
            capabilities=["planning", "coordination", "reasoning", "memory_inspection"],
            allowed_tools=["read_file", "list_dir", "web_search"],
            model="gemini-3.5-flash",
            is_system=True,
            can_delete=False,
        )

    async def _recall_context(
        self,
        tenant_id: str,
        query: str,
        worker_id: Optional[str] = None,
        project_id: Optional[str] = None,
    ) -> Tuple[List[Any], List[str]]:
        """Recalls relevant memories from Phase 2 hybrid vector + keyword index."""
        try:
            results = await self.retriever.search(
                tenant_id=tenant_id,
                query=query,
                project_id=project_id,
                worker_id=worker_id,
                top_k=4,
                threshold=0.05,
            )
            memories = [r.memory for r in results]
            ids = [m.id for m in memories]
            return memories, ids
        except Exception:
            return [], []

    async def _distill_preferences_if_present(
        self,
        tenant_id: str,
        user_id: str,
        project_id: Optional[str],
        content: str,
    ) -> None:
        """Detects user instructions/preferences and stores them in Semantic Memory."""
        pref_patterns = [
            r"always\s+(?:use|prefer|write|keep|run)\s+([^.!?]+)",
            r"never\s+(?:use|touch|modify|delete|run)\s+([^.!?]+)",
            r"i\s+prefer\s+([^.!?]+)",
            r"remember\s+that\s+([^.!?]+)",
            r"our\s+(?:standard|rule|convention)\s+is\s+([^.!?]+)",
        ]
        for pat in pref_patterns:
            match = re.search(pat, content, re.IGNORECASE)
            if match:
                extracted = match.group(0).strip()
                try:
                    await self.semantic_engine.store_fact(
                        tenant_id=tenant_id,
                        title=f"User Preference: {extracted[:40]}",
                        content=extracted,
                        scope=MemoryScope.USER,
                        user_id=user_id,
                        project_id=project_id,
                        tags=["user_preference", "rule"],
                    )
                except Exception:
                    pass
                break

    def _detect_tool_intent(self, content: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        """Detects if message is a tool execution request (e.g. read file, search, list dir)."""
        lower = content.strip().lower()

        # Read file
        read_match = re.search(r"(?:read|view|show|check|inspect)\s+(?:file\s+)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)", content, re.IGNORECASE)
        if read_match:
            return "read_file", {"path": read_match.group(1)}

        # List dir
        if "list files" in lower or "ls " in lower or "show directory" in lower:
            path_match = re.search(r"(?:in|of|path)\s+([a-zA-Z0-9_\-./]+)", content, re.IGNORECASE)
            return "list_dir", {"path": path_match.group(1) if path_match else "."}

        # Search web
        search_match = re.search(r"(?:search\s+for|google|web\s+search)\s+[\"']?([^\"'\n]+)[\"']?", content, re.IGNORECASE)
        if search_match:
            return "web_search", {"query": search_match.group(1)}

        # Explicit /tool command syntax
        if lower.startswith("/read "):
            return "read_file", {"path": content[6:].strip()}
        if lower.startswith("/search "):
            return "web_search", {"query": content[8:].strip()}

        return None

    def _generate_response(
        self,
        worker: WorkerDefinition,
        user_content: str,
        recalled_memories: List[Any],
        tool_invocations: List[Dict[str, Any]],
        gate_id: Optional[str] = None,
    ) -> str:
        """Generates contextual response adhering to worker persona, memory, and tool results."""
        lines = []

        # Recalled memory contextual awareness
        if recalled_memories:
            mem_titles = [m.title for m in recalled_memories]
            lines.append(f"*(Recalled context from Memory Graph: {', '.join(mem_titles[:2])})*\n")

        # Tool execution results / Gate requests
        if gate_id:
            lines.append(f"> ⚠️ **Approval Required**: Action is paused pending your review (Gate ID: `{gate_id}`). Please approve or reject below to proceed.\n")

        for inv in tool_invocations:
            tool = inv["tool"]
            res = inv["result"]
            if res.get("status") == "error":
                lines.append(f"❌ **Tool Execution Error ({tool})**: {res.get('error')}\n")
            elif res.get("status") == "success":
                output = str(res.get("output") or res.get("items") or "Completed.")
                if len(output) > 250:
                    output = output[:250] + "... [truncated]"
                lines.append(f"✅ **Tool Executed ({tool})**:\n```\n{output}\n```\n")

        # Main persona response
        if "hello" in user_content.lower() or "hi" in user_content.lower():
            lines.append(f"Hello! I am **{worker.name}** ({worker.role}). {worker.persona_prompt}")
        else:
            lines.append(f"As **{worker.name}** ({worker.role}), I have reviewed your request: \"{user_content}\".")
            if recalled_memories:
                lines.append(f"According to the living Memory Graph, I'm taking into account your project preferences and conventions.")
            lines.append("I am ready to proceed with engineering execution, research, or further task delegation.")

        return "\n\n".join(lines)
