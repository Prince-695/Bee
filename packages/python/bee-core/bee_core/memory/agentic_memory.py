"""Agentic Memory Engine: Episodic Flight Recall & Semantic Code Search."""

from __future__ import annotations

import json
import math
import uuid
from typing import Any, Dict, List, Optional
from bee_core.db.connection import get_db_engine


def mock_compute_embedding(text: str, dim: int = 768) -> List[float]:
    """Deterministic hash-based embedding vector generator for zero-cost semantic search."""
    vec = [0.0] * dim
    words = text.lower().split()
    if not words:
        return vec
    for word in words:
        h = hash(word) % dim
        vec[h] += 1.0
    # Normalize vector
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two vector lists."""
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    return dot


class AgenticMemoryEngine:
    """Engine for saving and recalling episodic remediations and codebase semantics."""

    def __init__(self):
        self.db = get_db_engine()

    async def save_flight_remediation(
        self,
        tenant_id: str,
        problem_signature: str,
        patch_diff: str,
        error_log: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> str:
        """Store a verified code patch in episodic memory."""
        memory_id = f"mem_{uuid.uuid4().hex[:12]}"
        tags_json = json.dumps(tags or [])
        text_for_embedding = f"{problem_signature} {error_log or ''}"
        embedding = mock_compute_embedding(text_for_embedding)

        if self.db.is_postgres:
            # PostgreSQL pgvector insertion
            await self.db.execute(
                "INSERT INTO flight_memories (id, tenant_id, problem_signature, error_log, patch_diff, tags_json, embedding) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (memory_id, tenant_id, problem_signature, error_log, patch_diff, tags_json, str(embedding)),
            )
        else:
            # SQLite insertion
            await self.db.execute(
                "INSERT INTO flight_memories (id, tenant_id, problem_signature, error_log, patch_diff, tags_json, embedding_json) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (memory_id, tenant_id, problem_signature, error_log, patch_diff, tags_json, json.dumps(embedding)),
            )

        return memory_id

    async def recall_remediations(
        self,
        tenant_id: str,
        error_signature: str,
        top_k: int = 3,
        threshold: float = 0.1,
    ) -> List[Dict[str, Any]]:
        """Recall top matching verified remediations from past flights."""
        query_vec = mock_compute_embedding(error_signature)

        records = await self.db.fetch_all(
            "SELECT * FROM flight_memories WHERE tenant_id = ?",
            (tenant_id,),
        )

        scored = []
        for r in records:
            emb_str = r.get("embedding_json") or r.get("embedding")
            if not emb_str:
                continue
            try:
                emb = json.loads(emb_str) if isinstance(emb_str, str) and emb_str.startswith("[") else []
            except Exception:
                emb = []

            score = cosine_similarity(query_vec, emb) if emb else 0.0
            if score >= threshold:
                scored.append({
                    "id": r["id"],
                    "problem_signature": r["problem_signature"],
                    "error_log": r.get("error_log"),
                    "patch_diff": r["patch_diff"],
                    "similarity_score": round(score, 4),
                    "created_at": r.get("created_at"),
                })

        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_k]

    async def index_codebase_chunk(
        self,
        project_id: str,
        file_path: str,
        chunk_content: str,
        symbol_name: Optional[str] = None,
    ) -> str:
        """Index a code file or AST symbol chunk into codebase embeddings."""
        chunk_id = f"emb_{uuid.uuid4().hex[:12]}"
        embedding = mock_compute_embedding(f"{file_path} {symbol_name or ''} {chunk_content}")

        if self.db.is_postgres:
            await self.db.execute(
                "INSERT INTO codebase_embeddings (id, project_id, file_path, symbol_name, chunk_content, embedding) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (chunk_id, project_id, file_path, symbol_name, chunk_content, str(embedding)),
            )
        else:
            await self.db.execute(
                "INSERT INTO codebase_embeddings (id, project_id, file_path, symbol_name, chunk_content, embedding_json) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (chunk_id, project_id, file_path, symbol_name, chunk_content, json.dumps(embedding)),
            )

        return chunk_id

    async def semantic_search_code(
        self,
        project_id: str,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search codebase AST symbols and chunks by natural language meaning."""
        query_vec = mock_compute_embedding(query)

        records = await self.db.fetch_all(
            "SELECT * FROM codebase_embeddings WHERE project_id = ?",
            (project_id,),
        )

        scored = []
        for r in records:
            emb_str = r.get("embedding_json") or r.get("embedding")
            if not emb_str:
                continue
            try:
                emb = json.loads(emb_str) if isinstance(emb_str, str) and emb_str.startswith("[") else []
            except Exception:
                emb = []

            score = cosine_similarity(query_vec, emb) if emb else 0.0
            scored.append({
                "id": r["id"],
                "file_path": r["file_path"],
                "symbol_name": r.get("symbol_name"),
                "chunk_content": r["chunk_content"],
                "similarity_score": round(score, 4),
            })

        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_k]


_memory_engine: Optional[AgenticMemoryEngine] = None


def get_memory_engine() -> AgenticMemoryEngine:
    global _memory_engine
    if _memory_engine is None:
        _memory_engine = AgenticMemoryEngine()
    return _memory_engine
