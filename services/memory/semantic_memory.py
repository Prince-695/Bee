"""Semantic Memory Engine: Stores, Deduplicates, and Formats Domain Facts & Conventions."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict, List, Optional

from services.memory.models import (
    Citation,
    MemoryRecord,
    MemoryScope,
    MemoryType,
    _utc_now_iso,
)
from services.memory.retriever import HybridRetriever, compute_embedding, cosine_similarity

if TYPE_CHECKING:
    from services.data.repositories.memory_repo import MemoryRepository


class SemanticMemoryEngine:
    """Manages semantic knowledge, user preferences, and architectural guidelines."""

    def __init__(
        self,
        memory_repo: Optional[Any] = None,
        retriever: Optional[HybridRetriever] = None,
    ):
        if memory_repo is None:
            from services.data.repositories.memory_repo import MemoryRepository
            self.repo = MemoryRepository()
        else:
            self.repo = memory_repo
        self.retriever = retriever or HybridRetriever(memory_repo=self.repo)

    async def store_fact(
        self,
        tenant_id: str,
        title: str,
        content: str,
        scope: MemoryScope = MemoryScope.PROJECT,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
        worker_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        citations: Optional[List[Citation]] = None,
        confidence: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryRecord:
        """Stores a semantic fact, guideline, or preference with automatic deduplication."""
        embedding = compute_embedding(f"{title} {content}")
        tag_list = tags or []

        # Check for existing contradictory or duplicate facts in the same scope
        existing = await self.repo.list_memories(
            tenant_id=tenant_id,
            scope=scope.value,
            memory_type=MemoryType.SEMANTIC.value,
            project_id=project_id,
            worker_id=worker_id,
            limit=20,
        )

        # Deduplication / Conflict check
        for item in existing:
            # Check if titles match or if embeddings have very high similarity (> 0.88)
            sim = cosine_similarity(embedding, item.embedding or compute_embedding(f"{item.title} {item.content}"))
            if item.title.strip().lower() == title.strip().lower() or sim > 0.88:
                # Update existing fact with new content and updated timestamp
                updated = await self.repo.update_memory(
                    memory_id=item.id,
                    tenant_id=tenant_id,
                    updates={
                        "title": title,
                        "content": content,
                        "confidence": confidence,
                        "tags": list(set(item.tags + tag_list)),
                        "metadata": {**(item.metadata or {}), **(metadata or {}), "superseded_previous": item.content},
                    },
                )
                if updated:
                    return updated

        # Otherwise create new record
        record = MemoryRecord(
            tenant_id=tenant_id,
            user_id=user_id,
            project_id=project_id,
            worker_id=worker_id,
            type=MemoryType.SEMANTIC,
            scope=scope,
            title=title,
            content=content,
            tags=tag_list,
            metadata=metadata or {},
            confidence=confidence,
            embedding=embedding,
            citations=citations or [],
        )
        return await self.repo.create_memory(record)

    async def get_relevant_facts(
        self,
        tenant_id: str,
        query: str,
        scope: Optional[MemoryScope] = None,
        project_id: Optional[str] = None,
        top_k: int = 5,
    ) -> List[MemoryRecord]:
        """Queries the most relevant semantic memories for a task or prompt."""
        scored = await self.retriever.search(
            tenant_id=tenant_id,
            query=query,
            scope=scope,
            memory_type=MemoryType.SEMANTIC,
            project_id=project_id,
            top_k=top_k,
        )
        return [s.memory for s in scored]

    async def format_context_for_prompt(
        self,
        tenant_id: str,
        query: str,
        project_id: Optional[str] = None,
        top_k: int = 4,
    ) -> str:
        """Formats relevant semantic memories into a clean Markdown block for LLM prompts."""
        facts = await self.get_relevant_facts(
            tenant_id=tenant_id,
            query=query,
            project_id=project_id,
            top_k=top_k,
        )
        if not facts:
            return ""

        lines = ["### Relevant Project & Workspace Conventions (Learned Memory):"]
        for f in facts:
            source_info = ""
            if f.citations:
                source_info = f" *(source: {f.citations[0].source_id})*"
            lines.append(f"- **{f.title}**: {f.content}{source_info}")
        return "\n".join(lines)
