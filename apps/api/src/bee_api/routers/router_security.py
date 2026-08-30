"""Security Audit, Secret Redaction, and Token Budget REST API Router."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from bee_api.config import DB_PATH
from bee_core.security.budget_engine import BudgetEngine
from bee_core.security.secret_redactor import SecretRedactor

router = APIRouter(prefix="/api/security", tags=["security"])
_budget_engine = BudgetEngine(DB_PATH)


class RedactTextRequest(BaseModel):
    text: str


class RecordSpendRequest(BaseModel):
    model: str = "gemini-2.5-flash"
    prompt_tokens: int
    completion_tokens: int
    route_id: Optional[str] = None
    flight_id: Optional[str] = None


@router.post("/redact")
async def test_redact_text(req: RedactTextRequest) -> Dict[str, Any]:
    """Test and verify secret redaction on sensitive strings."""
    redacted_text, detected = SecretRedactor.redact_text(req.text)
    return {
        "success": True,
        "data": {
            "redacted_text": redacted_text,
            "detected_secrets": detected,
            "secret_count": len(detected),
        },
    }


@router.get("/spend")
async def get_total_spend() -> Dict[str, Any]:
    """Retrieve total prompt tokens, completion tokens, and estimated cost across all flights."""
    spend = _budget_engine.get_aggregate_spend()
    return {"success": True, "data": spend}


@router.get("/usage")
async def list_usage_records(limit: int = Query(default=50, le=100)) -> Dict[str, Any]:
    """List recent flight-level token usage records."""
    records = _budget_engine.list_usage_records(limit=limit)
    return {"success": True, "data": records, "count": len(records)}


@router.post("/record-spend", status_code=status.HTTP_201_CREATED)
async def record_flight_spend(req: RecordSpendRequest) -> Dict[str, Any]:
    """Record token consumption for an execution flight."""
    record = _budget_engine.record_usage(
        model=req.model,
        prompt_tokens=req.prompt_tokens,
        completion_tokens=req.completion_tokens,
        route_id=req.route_id,
        flight_id=req.flight_id,
    )
    return {"success": True, "data": record.model_dump()}
