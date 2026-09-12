"""Approval Gate Details Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from bee_core.stores.gate_store import get_gate
from bee_api.core.dependencies import get_current_tenant

router = APIRouter(prefix="/v1/approvals", tags=["Approvals & Human Gates"])


@router.get("/{gate_id}")
async def get_approval_gate_endpoint(
    gate_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Get single approval gate details."""
    gate = get_gate(gate_id)
    if not gate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval gate not found")
    return gate
