"""Remediation Memory Storage & Recall Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.memory.schemas import SaveRemediationRequest
from bee_core.memory.agentic_memory import get_memory_engine

router = APIRouter(prefix="/v1/memory", tags=["Agentic Memory & Knowledge"])


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
