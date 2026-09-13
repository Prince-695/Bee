"""Code Search and Generalized Hybrid Memory Search Router."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status
from bee_api.core.dependencies import get_current_tenant, get_current_user
from bee_api.domains.memory.schemas import (
    CitationSchema,
    IndexCodeRequest,
    MemoryResponse,
    ScoredMemoryResponse,
    SearchCodeRequest,
    SearchMemoryRequest,
)
from bee_core.memory.agentic_memory import get_memory_engine
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import MemoryScope, MemoryType
from services.memory.retriever import HybridRetriever

router = APIRouter(prefix="/v1/memory", tags=["Agentic Memory & Knowledge"])


# ─── Generalized Hybrid Memory Search ───

@router.post("/search", response_model=List[ScoredMemoryResponse])
async def search_memory(
    body: SearchMemoryRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Performs hybrid vector + keyword search over tenant memories across all tiers."""
    retriever = HybridRetriever()
    scope_enum = MemoryScope(body.scope) if body.scope else None
    type_enum = MemoryType(body.type) if body.type else None

    scored = await retriever.search(
        tenant_id=tenant["tenant_id"],
        query=body.query,
        scope=scope_enum,
        memory_type=type_enum,
        project_id=body.project_id,
        worker_id=body.worker_id,
        top_k=body.top_k,
        threshold=body.threshold,
    )

    results: List[ScoredMemoryResponse] = []
    for s in scored:
        citations = [
            CitationSchema(
                source_id=c.source_id,
                source_type=c.source_type,
                location=c.location,
                snippet=c.snippet,
                timestamp=c.timestamp,
            )
            for c in s.memory.citations
        ]
        mem_resp = MemoryResponse(
            id=s.memory.id,
            tenant_id=s.memory.tenant_id,
            user_id=s.memory.user_id,
            project_id=s.memory.project_id,
            worker_id=s.memory.worker_id,
            type=s.memory.type.value,
            scope=s.memory.scope.value,
            title=s.memory.title,
            content=s.memory.content,
            tags=s.memory.tags,
            metadata=s.memory.metadata,
            confidence=s.memory.confidence,
            citations=citations,
            created_at=s.memory.created_at,
            updated_at=s.memory.updated_at,
        )
        primary_cit = None
        if s.citation:
            primary_cit = CitationSchema(
                source_id=s.citation.source_id,
                source_type=s.citation.source_type,
                location=s.citation.location,
                snippet=s.citation.snippet,
                timestamp=s.citation.timestamp,
            )
        results.append(
            ScoredMemoryResponse(
                memory=mem_resp,
                score=s.score,
                vector_score=s.vector_score,
                keyword_score=s.keyword_score,
                citation=primary_cit,
            )
        )
    return results


# ─── Legacy Code Search & AST Indexing ───

@router.post("/search-code")
async def search_code(
    body: SearchCodeRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Search repository AST symbols and code chunks by natural language meaning."""
    mem_engine = get_memory_engine()
    results = await mem_engine.semantic_search_code(
        project_id=body.project_id,
        query=body.query,
        top_k=body.top_k,
    )
    return {"query": body.query, "results": results, "count": len(results)}


@router.post("/index-chunk", status_code=status.HTTP_201_CREATED)
@router.post("/index", status_code=status.HTTP_201_CREATED)
async def index_code_chunk(
    body: IndexCodeRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Index an AST symbol or file chunk into project codebase embeddings."""
    mem_engine = get_memory_engine()
    chunk_id = await mem_engine.index_codebase_chunk(
        project_id=body.project_id,
        file_path=body.file_path,
        chunk_content=body.chunk_content,
        symbol_name=body.symbol_name,
    )
    return {"chunk_id": chunk_id, "status": "indexed", "file_path": body.file_path}
