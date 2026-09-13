"""Episodic Memory Engine: Execution Traces, Error Signatures, and Verified Fix Remediations."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from services.memory.models import (
    Citation,
    EpisodicRemediation,
    MemoryRecord,
    MemoryScope,
    MemoryType,
)
from services.memory.retriever import compute_embedding, cosine_similarity

if TYPE_CHECKING:
    from services.data.repositories.memory_repo import MemoryRepository


def normalize_error_signature(raw_error: str) -> str:
    """Normalizes error messages and stack traces for resilient fuzzy matching.
    
    Removes specific line numbers, memory pointers, timestamps, and UUIDs.
    """
    if not raw_error:
        return ""

    text = raw_error.strip()
    # Replace file lines (e.g., 'line 42', 'line 108')
    text = re.sub(r"line \d+", "line <N>", text, flags=re.IGNORECASE)
    # Replace memory hex pointers (e.g., 0x7f99ab4b8d60)
    text = re.sub(r"0x[0-9a-fA-F]+", "<ADDR>", text)
    # Replace UUIDs
    text = re.sub(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        "<UUID>",
        text,
    )
    # Replace ISO timestamps
    text = re.sub(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?", "<TIMESTAMP>", text)
    # Collapse multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


class EpisodicMemoryEngine:
    """Manages episodic run logs, failure traces, and verified self-healing remediations."""

    def __init__(self, memory_repo: Optional[Any] = None):
        if memory_repo is None:
            from services.data.repositories.memory_repo import MemoryRepository
            self.repo = MemoryRepository()
        else:
            self.repo = memory_repo

    async def record_execution_trace(
        self,
        tenant_id: str,
        mission_id: str,
        task_title: str,
        content: str,
        worker_id: Optional[str] = None,
        project_id: Optional[str] = None,
        success: bool = True,
        artifacts: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> MemoryRecord:
        """Records an execution trace or mission milestone into episodic memory."""
        status_label = "Success" if success else "Failed"
        title = f"[{status_label}] {task_title} (Mission: {mission_id})"
        citation = Citation(
            source_id=mission_id,
            source_type="mission",
            location=f"task:{task_title}",
            snippet=content[:120],
        )

        record = MemoryRecord(
            tenant_id=tenant_id,
            project_id=project_id,
            worker_id=worker_id,
            type=MemoryType.EPISODIC,
            scope=MemoryScope.PROJECT,
            title=title,
            content=content,
            tags=(tags or []) + ["execution_trace", "success" if success else "failure"],
            metadata={"mission_id": mission_id, "success": success, "artifacts": artifacts or []},
            confidence=1.0,
            citations=[citation],
        )
        return await self.repo.create_memory(record)

    async def record_verified_fix(
        self,
        tenant_id: str,
        problem_signature: str,
        patch_diff: str,
        error_log: Optional[str] = None,
        verified_by_worker_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> EpisodicRemediation:
        """Commits a verified error-patch solution to episodic memory."""
        norm_sig = normalize_error_signature(problem_signature)
        text_for_emb = f"{norm_sig} {error_log or ''}"
        emb = compute_embedding(text_for_emb)

        # Check existing remediations for match
        existing_list = await self.repo.list_remediations(tenant_id=tenant_id, limit=100)
        for existing in existing_list:
            if normalize_error_signature(existing.problem_signature) == norm_sig:
                # Update patch diff and increment success
                await self.repo.increment_remediation_success(existing.id, tenant_id)
                existing.success_count += 1
                existing.patch_diff = patch_diff
                return existing

        remediation = EpisodicRemediation(
            tenant_id=tenant_id,
            problem_signature=norm_sig,
            error_log=error_log,
            patch_diff=patch_diff,
            verified_by_worker_id=verified_by_worker_id,
            success_count=1,
            tags=tags or [],
            embedding=emb,
        )
        return await self.repo.save_remediation(remediation)

    async def recall_remediations(
        self,
        tenant_id: str,
        error_signature: str,
        top_k: int = 3,
        threshold: float = 0.2,
    ) -> List[Dict[str, Any]]:
        """Recalls the highest-confidence verified code patches matching an error signature."""
        norm_query = normalize_error_signature(error_signature)
        query_vec = compute_embedding(norm_query)

        all_rem = await self.repo.list_remediations(tenant_id=tenant_id, limit=200)
        scored: List[Dict[str, Any]] = []

        for rem in all_rem:
            rem_vec = rem.embedding or compute_embedding(f"{rem.problem_signature} {rem.error_log or ''}")
            sim = cosine_similarity(query_vec, rem_vec)

            # Boost score based on past success count: log scale boost
            success_boost = min(0.2, (rem.success_count - 1) * 0.05)
            final_score = min(1.0, sim + success_boost)

            if final_score >= threshold or norm_query == rem.problem_signature:
                scored.append({
                    "id": rem.id,
                    "problem_signature": rem.problem_signature,
                    "patch_diff": rem.patch_diff,
                    "error_log": rem.error_log,
                    "verified_by_worker_id": rem.verified_by_worker_id,
                    "success_count": rem.success_count,
                    "tags": rem.tags,
                    "similarity_score": round(final_score, 4),
                })

        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:top_k]
