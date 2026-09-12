"""Liveness Probe Router."""

from __future__ import annotations

from fastapi import APIRouter, status
from bee_api.domains.health.schemas import HealthLiveResponse

router = APIRouter()


@router.get("/live", response_model=HealthLiveResponse, status_code=status.HTTP_200_OK)
async def health_live() -> HealthLiveResponse:
    """Kubernetes/Docker liveness probe returning HTTP 200 if container process is running."""
    return HealthLiveResponse(status="ok")
