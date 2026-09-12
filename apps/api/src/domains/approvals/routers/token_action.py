"""One-Click Approval Gate Action Endpoint."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Query, status

from bee_core.db.connection import get_db_engine
from bee_core.stores.gate_store import resolve_gate

router = APIRouter(prefix="/v1/approvals", tags=["Approvals & Human Gates"])


@router.get("/token-action/{token_hash}")
async def handle_token_action(
    token_hash: str,
    action: str = Query(default="approve", description="'approve' | 'reject'"),
) -> Dict[str, Any]:
    """Execute one-click approval or rejection from a verified external link."""
    db = get_db_engine()
    gate = await db.fetch_one(
        "SELECT id, status FROM approval_gates WHERE token_hash = ?",
        (token_hash,),
    )
    if not gate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval token invalid or expired",
        )

    gate_id = gate["id"]
    new_status = "approved" if action == "approve" else "rejected"
    updated = resolve_gate(gate_id, status=new_status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gate is already in status '{gate['status']}'",
        )

    return {
        "gate_id": gate_id,
        "action": action,
        "status": new_status,
        "message": f"Successfully processed one-click {action}.",
    }
