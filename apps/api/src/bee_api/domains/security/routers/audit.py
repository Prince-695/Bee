"""Security Audit & Secret Redaction Router."""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, status
from bee_api.core.config import settings
from bee_api.domains.security.schemas import RedactTextRequest, RecordSpendRequest
from bee_core.security.budget_engine import BudgetEngine
from bee_core.security.secret_redactor import SecretRedactor

router = APIRouter(prefix="/api/security", tags=["security"])
_budget_engine = BudgetEngine(settings.DB_PATH)


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
async def get_usage_records(limit: int = 50) -> Dict[str, Any]:
    """List recent token usage records."""
    records = _budget_engine.list_usage_records(limit=limit)
    return {"success": True, "data": records}


@router.post("/usage")
@router.post("/record-spend", status_code=status.HTTP_201_CREATED)
async def record_flight_usage(req: RecordSpendRequest) -> Dict[str, Any]:
    """Record token consumption for a flight or route."""
    record = _budget_engine.record_usage(
        prompt_tokens=req.prompt_tokens,
        completion_tokens=req.completion_tokens,
        model=req.model,
        route_id=req.route_id,
        flight_id=req.flight_id,
    )
    return {"success": True, "data": record.model_dump() if hasattr(record, "model_dump") else record}

