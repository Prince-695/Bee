"""Context Synthesis Router: Aggregates missions, gates, memories, and morning briefing."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.memory.schemas import SynthesizeContextRequest
from services.agent_runtime.browser_worker import BrowserHistoryEntry
from services.memory.context_engine import ContextEngine, ContextSynthesisResult

router = APIRouter(prefix="/v1/context", tags=["Context Engine"])


@router.get("", response_model=ContextSynthesisResult)
async def get_active_context(
    project_id: Optional[str] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Retrieves current synthesized context for the workspace."""
    engine = ContextEngine()
    result = await engine.synthesize_workspace_context(
        tenant_id=tenant["tenant_id"],
        user_id=tenant.get("user_id"),
        project_id=project_id,
    )
    return result


@router.post("/synthesize", response_model=ContextSynthesisResult)
async def synthesize_context(
    body: SynthesizeContextRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Synthesizes holistic context and generates morning executive briefing."""
    engine = ContextEngine()
    b_entries = []
    for b in body.browser_history:
        if b.get("url") and b.get("title"):
            kwargs: Dict[str, Any] = {
                "url": b["url"],
                "title": b["title"],
                "account_id": b.get("account_id") or body.signed_in_account or "default",
                "category": b.get("category", "general"),
            }
            if b.get("timestamp"):
                kwargs["timestamp"] = b["timestamp"]
            b_entries.append(BrowserHistoryEntry(**kwargs))
    result = await engine.synthesize_workspace_context(
        tenant_id=tenant["tenant_id"],
        user_id=tenant.get("user_id"),
        project_id=body.project_id,
        git_summary=body.git_summary,
        browser_history=b_entries,
        browser_permission_granted=body.browser_permission_granted,
        signed_in_account=body.signed_in_account,
    )
    return result
