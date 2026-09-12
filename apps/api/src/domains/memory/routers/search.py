"""Code Search and Indexing Memory Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from bee_api.core.dependencies import get_current_user
from bee_api.domains.memory.schemas import SearchCodeRequest, IndexCodeRequest
from bee_core.memory.agentic_memory import get_memory_engine

router = APIRouter(prefix="/v1/memory", tags=["Agentic Memory & Knowledge"])


@router.post("/search-code")
@router.post("/search")
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
