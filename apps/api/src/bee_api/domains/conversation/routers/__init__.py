"""Conversation Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.conversation.routers import (
    start,
    message,
    history,
    turn,
)

router = APIRouter()
router.include_router(start.router)
router.include_router(message.router)
router.include_router(history.router)
router.include_router(turn.router)
