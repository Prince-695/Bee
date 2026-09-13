"""Memory CRUD and Context Graph Router."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.memory.schemas import (
    CitationSchema,
    CreateLinkRequest,
    CreateMemoryRequest,
    LinkResponse,
    MemoryResponse,
    UpdateMemoryRequest,
)
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.models import (
    Citation,
    LinkRelation,
    MemoryLink,
    MemoryRecord,
    MemoryScope,
    MemoryType,
)

router = APIRouter(prefix="/v1/memory", tags=["Agentic Memory & Knowledge"])


def _to_memory_response(mem: MemoryRecord) -> MemoryResponse:
    citations = [
        CitationSchema(
            source_id=c.source_id,
            source_type=c.source_type,
            location=c.location,
            snippet=c.snippet,
            timestamp=c.timestamp,
        )
        for c in mem.citations
    ]
    return MemoryResponse(
        id=mem.id,
        tenant_id=mem.tenant_id,
        user_id=mem.user_id,
        project_id=mem.project_id,
        worker_id=mem.worker_id,
        type=mem.type.value,
        scope=mem.scope.value,
        title=mem.title,
        content=mem.content,
        tags=mem.tags,
        metadata=mem.metadata,
        confidence=mem.confidence,
        citations=citations,
        created_at=mem.created_at,
        updated_at=mem.updated_at,
    )


def _to_link_response(link: MemoryLink) -> LinkResponse:
    return LinkResponse(
        id=link.id,
        tenant_id=link.tenant_id,
        source_id=link.source_id,
        source_type=link.source_type,
        target_id=link.target_id,
        target_type=link.target_type,
        relation=link.relation.value,
        weight=link.weight,
        metadata=link.metadata,
        created_at=link.created_at,
    )


@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    scope: Optional[str] = Query(None, description="Filter by scope (user, project, organization, worker)"),
    type: Optional[str] = Query(None, description="Filter by type (episodic, semantic, working)"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    worker_id: Optional[str] = Query(None, description="Filter by worker ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Lists memories for the current tenant with optional filters."""
    repo = MemoryRepository()
    records = await repo.list_memories(
        tenant_id=tenant["tenant_id"],
        scope=scope,
        memory_type=type,
        project_id=project_id,
        worker_id=worker_id,
        limit=limit,
        offset=offset,
    )
    return [_to_memory_response(r) for r in records]


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    body: CreateMemoryRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Creates a new memory record in the specified tier and scope."""
    repo = MemoryRepository()
    citations = [
        Citation(
            source_id=c.source_id,
            source_type=c.source_type,
            location=c.location,
            snippet=c.snippet,
        )
        for c in body.citations
    ]
    record = MemoryRecord(
        tenant_id=tenant["tenant_id"],
        user_id=tenant.get("user_id"),
        project_id=body.project_id,
        worker_id=body.worker_id,
        type=MemoryType(body.type),
        scope=MemoryScope(body.scope),
        title=body.title,
        content=body.content,
        tags=body.tags,
        metadata=body.metadata,
        confidence=body.confidence,
        citations=citations,
    )
    created = await repo.create_memory(record)
    return _to_memory_response(created)


@router.get("/{memory_id}", response_model=Dict[str, Any])
async def get_memory_with_graph(
    memory_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Retrieves a memory item and its adjacent context graph edges."""
    repo = MemoryRepository()
    mem = await repo.get_memory(memory_id, tenant["tenant_id"])
    if not mem:
        raise HTTPException(status_code=404, detail="Memory item not found.")

    links = await repo.get_links_for_node(memory_id, tenant["tenant_id"])
    return {
        "memory": _to_memory_response(mem),
        "links": [_to_link_response(l) for l in links],
    }


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    body: UpdateMemoryRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Updates an existing memory item."""
    repo = MemoryRepository()
    updates = body.model_dump(exclude_unset=True)
    updated = await repo.update_memory(memory_id, tenant["tenant_id"], updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Memory item not found.")
    return _to_memory_response(updated)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_memory(
    memory_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Purges a memory item and cascades deletion of context graph links (Forget guarantee)."""
    repo = MemoryRepository()
    deleted = await repo.delete_memory(memory_id, tenant["tenant_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory item not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ─── Context Graph Links Endpoints ───

@router.post("/links", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
async def create_graph_link(
    body: CreateLinkRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Creates a directed relationship edge in the Context Graph."""
    repo = MemoryRepository()
    link = MemoryLink(
        tenant_id=tenant["tenant_id"],
        source_id=body.source_id,
        source_type=body.source_type,
        target_id=body.target_id,
        target_type=body.target_type,
        relation=LinkRelation(body.relation),
        weight=body.weight,
        metadata=body.metadata,
    )
    created = await repo.create_link(link)
    return _to_link_response(created)


@router.get("/links/{node_id}", response_model=List[LinkResponse])
async def get_node_links(
    node_id: str,
    direction: str = Query("both", description="'in', 'out', or 'both'"),
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Retrieves all Context Graph edges attached to a specific entity node."""
    repo = MemoryRepository()
    links = await repo.get_links_for_node(node_id, tenant["tenant_id"], direction=direction)
    return [_to_link_response(l) for l in links]


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_graph_link(
    link_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Deletes a relationship edge from the Context Graph."""
    repo = MemoryRepository()
    deleted = await repo.delete_link(link_id, tenant["tenant_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Context link not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
