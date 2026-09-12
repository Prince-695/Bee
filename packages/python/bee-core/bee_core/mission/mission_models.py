"""Data models for Hierarchical Multi-Worker Missions."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MissionStage(str, Enum):
    SCOUT = "scout"
    TEST_SYNTHESIS = "test_synthesis"
    REMEDIATION = "remediation"
    SAFETY_GUARD = "safety_guard"
    SCRIBE_REPORT = "scribe_report"
    COMPLETED = "completed"
    FAILED = "failed"


class Finding(BaseModel):
    finding_id: str = Field(default_factory=lambda: f"fnd_{uuid.uuid4().hex[:8]}")
    title: str
    severity: str = "medium"  # critical, high, medium, low
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    description: str
    remediated: bool = False


class Mission(BaseModel):
    mission_id: str = Field(default_factory=lambda: f"msn_{uuid.uuid4().hex[:10]}")
    signal_id: Optional[str] = None
    objective: str
    status: str = "created"  # created, in_progress, gate_pending, completed, failed
    stage: MissionStage = MissionStage.SCOUT
    active_worker: str = "inspector"
    findings: List[Finding] = Field(default_factory=list)
    artifacts: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)
