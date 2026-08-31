"""Zero-Trust Human Approval Gates Router (/v1/approvals/*)."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from bee_core.stores.gate_store import list_gates, get_gate, resolve_gate
from bee_api.auth.dependencies import get_current_user, get_current_tenant

router = APIRouter(prefix="/v1/approvals", tags=["Approvals & Human Gates"])


class GateActionRequest(BaseModel):
    reason: Optional[str] = None


@router.get("")
async def list_approval_gates_endpoint(
    status_filter: Optional[str] = "pending",
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """List approval gates for the tenant organization."""
    status_arg = None if status_filter == "all" else status_filter
    gates = list_gates(status=status_arg)
    return {"gates": gates, "count": len(gates)}


@router.get("/{gate_id}")
async def get_approval_gate_endpoint(
    gate_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Get single approval gate details."""
    gate = get_gate(gate_id)
    if not gate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval gate not found")
    return gate


@router.post("/{gate_id}/approve")
async def approve_human_gate(
    gate_id: str,
    body: Optional[GateActionRequest] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Authorize a pending approval gate."""
    updated = resolve_gate(gate_id, status="approved")
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gate cannot be approved (not pending or not found)")
    return {"message": "Gate approved successfully", "gate": updated}


@router.post("/{gate_id}/reject")
async def reject_human_gate(
    gate_id: str,
    body: Optional[GateActionRequest] = None,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
):
    """Reject a pending approval gate."""
    updated = resolve_gate(gate_id, status="rejected")
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gate cannot be rejected (not pending or not found)")
    return {"message": "Gate rejected successfully", "gate": updated}
