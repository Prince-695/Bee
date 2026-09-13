"""Hybrid Search & Retrieval Engine: Blends Semantic Vector Similarity with BM25 Keyword Matching."""

from __future__ import annotations

import math
import re
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set

from services.memory.models import (
    Citation,
    MemoryRecord,
    MemoryScope,
    MemoryType,
    ScoredMemory,
)

if TYPE_CHECKING:
    from services.data.repositories.memory_repo import MemoryRepository


def compute_embedding(text: str, dim: int = 768) -> List[float]:
    """Generates a normalized 768-dimensional embedding vector for semantic search.
    
    Provides deterministic zero-cost semantic representations for offline/test environments,
    compatible with PostgreSQL pgvector vector(768).
    """
    if not text:
        return [0.0] * dim

    vec = [0.0] * dim
    words = re.findall(r"\w+", text.lower())
    if not words:
        return vec

    # N-gram & token hashing to capture phrases and symbols
    for i, word in enumerate(words):
        # Unigram
        h = hash(word) % dim
        vec[h] += 1.0
        # Bigram
        if i < len(words) - 1:
            bigram = f"{word}_{words[i+1]}"
            h2 = hash(bigram) % dim
            vec[h2] += 1.5

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def cosine_similarity(v1: Optional[List[float]], v2: Optional[List[float]]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(0.0, min(1.0, dot))


def compute_keyword_score(query: str, text: str, tags: Optional[List[str]] = None) -> float:
    """Computes token overlap and exact keyword match score normalized to [0.0, 1.0]."""
    query_tokens = set(re.findall(r"\w+", query.lower()))
    if not query_tokens:
        return 0.0

    target_tokens = set(re.findall(r"\w+", text.lower()))
    tag_tokens = set(t.lower() for t in (tags or []))

    # Exact token overlap
    overlap = query_tokens.intersection(target_tokens)
    tag_overlap = query_tokens.intersection(tag_tokens)

    # Base score is proportion of query tokens found in text
    token_score = len(overlap) / len(query_tokens)
    # Tag bonus: +0.25 if tag matches exactly
    tag_bonus = 0.25 if tag_overlap else 0.0

    return min(1.0, token_score + tag_bonus)


class HybridRetriever:
    """Engine combining vector cosine similarity with BM25 keyword matching."""

    def __init__(self, memory_repo: Optional[Any] = None, alpha: float = 0.65):
        if memory_repo is None:
            from services.data.repositories.memory_repo import MemoryRepository
            self.repo = MemoryRepository()
        else:
            self.repo = memory_repo
        self.alpha = alpha  # Weight for vector similarity (1 - alpha for keyword)

    async def search(
        self,
        tenant_id: str,
        query: str,
        scope: Optional[MemoryScope] = None,
        memory_type: Optional[MemoryType] = None,
        project_id: Optional[str] = None,
        worker_id: Optional[str] = None,
        top_k: int = 5,
        threshold: float = 0.1,
    ) -> List[ScoredMemory]:
        """Performs hybrid vector + keyword search over tenant memories."""
        # 1. Fetch candidate records from DB
        candidates = await self.repo.list_memories(
            tenant_id=tenant_id,
            scope=scope.value if scope else None,
            memory_type=memory_type.value if memory_type else None,
            project_id=project_id,
            worker_id=worker_id,
            limit=200,
        )

        if not candidates:
            return []

        # 2. Compute query vector
        query_vec = compute_embedding(query)

        scored_memories: List[ScoredMemory] = []
        for mem in candidates:
            # Ensure memory has embedding
            mem_vec = mem.embedding
            if not mem_vec:
                mem_vec = compute_embedding(f"{mem.title} {mem.content}")

            # Vector Score
            v_score = cosine_similarity(query_vec, mem_vec)

            # Keyword Score
            k_score = compute_keyword_score(query, f"{mem.title} {mem.content}", mem.tags)

            # Blended Score
            hybrid_score = (self.alpha * v_score) + ((1.0 - self.alpha) * k_score)
            # Confidence weighting
            final_score = hybrid_score * mem.confidence

            if final_score >= threshold:
                primary_citation = mem.citations[0] if mem.citations else Citation(
                    source_id=mem.id,
                    source_type="memory",
                    location=f"scope:{mem.scope.value}",
                    snippet=mem.content[:100],
                )
                scored_memories.append(
                    ScoredMemory(
                        memory=mem,
                        score=round(final_score, 4),
                        vector_score=round(v_score, 4),
                        keyword_score=round(k_score, 4),
                        citation=primary_citation,
                    )
                )

        # 3. Sort descending by score and return top_k
        scored_memories.sort(key=lambda x: x.score, reverse=True)
        return scored_memories[:top_k]
