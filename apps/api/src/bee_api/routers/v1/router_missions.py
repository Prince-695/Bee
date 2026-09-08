"""Autonomous 5-Worker Missions & DAG Router (/v1/missions/*).

Compatibility shim re-exporting modular domain router.
"""

from __future__ import annotations

from bee_api.domains.missions.schemas import (
    CreateMissionRequest,
    MissionListResponse,
    MissionDagNode,
    MissionDagResponse,
)
from bee_api.domains.missions.routers import router

__all__ = [
    "router",
    "CreateMissionRequest",
    "MissionListResponse",
    "MissionDagNode",
    "MissionDagResponse",
]
