"""Readiness Probe Router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from bee_api.core.database import check_db_health
from bee_api.domains.health.schemas import HealthReadyResponse

router = APIRouter()


@router.get("/ready", response_model=HealthReadyResponse, status_code=status.HTTP_200_OK)
async def health_ready() -> HealthReadyResponse:
    """Readiness probe checking database connectivity before routing traffic."""
    db_ok = await check_db_health()
    if not db_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is unhealthy",
        )
    return HealthReadyResponse(
        status="ready",
        database=True,
        components={"database": True},
    )
