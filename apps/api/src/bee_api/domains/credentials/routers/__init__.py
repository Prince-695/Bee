"""Credentials Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.credentials.routers import set_key, list_keys, delete_key

router = APIRouter()
router.include_router(set_key.router)
router.include_router(list_keys.router)
router.include_router(delete_key.router)
