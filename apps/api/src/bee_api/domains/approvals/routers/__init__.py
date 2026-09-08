"""Approvals Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.approvals.routers import (
    list_pending,
    get,
    resolve,
    token_action,
)

router = APIRouter()
router.include_router(list_pending.router)
router.include_router(get.router)
router.include_router(resolve.router)
router.include_router(token_action.router)
