"""Approval Gates Listing Endpoint."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends

from bee_core.stores.gate_store import list_gates
from bee_api.auth.dependencies import get_current_tenant
from bee_api.domains.approvals.schemas import ApprovalGateListResponse

router = APIRouter(prefix="/v1/approvals", tags=["Approvals & Human Gates"])


@router.get("", response_model=ApprovalGateListResponse)
async def list_approval_gates_endpoint(
    status_filter: Optional[str] = "pending",
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> ApprovalGateListResponse:
    """List approval gates for the tenant organization."""
    status_arg = None if status_filter == "all" else status_filter
    gates = list_gates(status=status_arg)
    return ApprovalGateListResponse(gates=gates, count=len(gates))
