"""Channels Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.channels.routers import (
    status,
    dispatch,
    voice_emergency,
)

router = APIRouter()
router.include_router(status.router)
router.include_router(dispatch.router)
router.include_router(voice_emergency.router)
