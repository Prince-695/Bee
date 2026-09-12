"""Approval Gate Resolution Endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.stores.gate_store import resolve_gate
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.approvals.schemas import GateActionRequest

router = APIRouter(prefix="/v1/approvals", tags=["Approvals & Human Gates"])


@router.post("/{gate_id}/approve")
async def approve_human_gate(
    gate_id: str,
    body: Optional[GateActionRequest] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Authorize a pending approval gate."""
    updated = resolve_gate(gate_id, status="approved")
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gate cannot be approved (not pending or not found)",
        )
    return {"message": "Gate approved successfully", "gate": updated}


@router.post("/{gate_id}/reject")
async def reject_human_gate(
    gate_id: str,
    body: Optional[GateActionRequest] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Reject a pending approval gate."""
    updated = resolve_gate(gate_id, status="rejected")
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gate cannot be rejected (not pending or not found)",
        )
    return {"message": "Gate rejected successfully", "gate": updated}
