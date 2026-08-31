"""Agentic Memory Router (/v1/memory/*)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from bee_core.memory.agentic_memory import get_memory_engine
from bee_api.auth.dependencies import get_current_user, get_current_tenant

router = APIRouter(prefix="/v1/memory", tags=["Agentic Memory & Knowledge"])


class SaveRemediationRequest(BaseModel):
    problem_signature: str = Field(..., description="E.g. 'AssertionError: test_oauth_token_refresh'")
    patch_diff: str = Field(..., description="Git unified diff patch")
    error_log: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class SearchCodeRequest(BaseModel):
    project_id: str
    query: str = Field(..., description="Natural language search query")
    top_k: int = Field(default=5, ge=1, le=20)


class IndexCodeRequest(BaseModel):
    project_id: str
    file_path: str
    chunk_content: str
    symbol_name: Optional[str] = None


@router.post("/remediations", status_code=status.HTTP_201_CREATED)
async def save_remediation(
    body: SaveRemediationRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Store a verified code patch in tenant's episodic memory."""
    mem_engine = get_memory_engine()
    memory_id = await mem_engine.save_flight_remediation(
        tenant_id=tenant["tenant_id"],
        problem_signature=body.problem_signature,
        patch_diff=body.patch_diff,
        error_log=body.error_log,
        tags=body.tags,
    )
    return {"id": memory_id, "status": "stored", "tenant_id": tenant["tenant_id"]}


@router.get("/remediations/recall")
async def recall_remediations(
    error_signature: str,
    top_k: int = 3,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Recall past verified code fixes matching the given error signature."""
    mem_engine = get_memory_engine()
    results = await mem_engine.recall_remediations(
        tenant_id=tenant["tenant_id"],
        error_signature=error_signature,
        top_k=top_k,
    )
    return {"matches": results, "count": len(results)}


@router.post("/search-code")
async def search_code(
    body: SearchCodeRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Search repository AST symbols and code chunks by natural language meaning."""
    mem_engine = get_memory_engine()
    results = await mem_engine.semantic_search_code(
        project_id=body.project_id,
        query=body.query,
        top_k=body.top_k,
    )
    return {"query": body.query, "results": results, "count": len(results)}


@router.post("/index-chunk", status_code=status.HTTP_201_CREATED)
async def index_code_chunk(
    body: IndexCodeRequest,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Index an AST symbol or file chunk into project codebase embeddings."""
    mem_engine = get_memory_engine()
    chunk_id = await mem_engine.index_codebase_chunk(
        project_id=body.project_id,
        file_path=body.file_path,
        chunk_content=body.chunk_content,
        symbol_name=body.symbol_name,
    )
    return {"chunk_id": chunk_id, "status": "indexed"}
