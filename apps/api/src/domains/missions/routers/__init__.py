"""Missions Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.missions.routers import (
    create,
    list_missions,
    get,
    stream,
    dag,
    cancel,
    api_missions,
    templates,
)

router = APIRouter()
router.include_router(templates.router)
router.include_router(create.router)
router.include_router(list_missions.router)
router.include_router(get.router)
router.include_router(stream.router)
router.include_router(dag.router)
router.include_router(cancel.router)
router.include_router(api_missions.router)

