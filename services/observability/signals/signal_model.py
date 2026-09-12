"""Engineering signal models and event representations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class EngineeringSignal(BaseModel):
    signal_id: str = Field(default_factory=lambda: f"sig_{uuid.uuid4().hex[:12]}")
    source: str  # github, gitlab, circleci, sentry, slack, generic
    event_type: str  # pr_opened, pr_updated, ci_failure, commit_pushed, alert, deploy_complete
    repository: str
    branch: Optional[str] = None
    sender: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: str = "received"  # received, matched_mission, ignored, processed
    matched_mission_id: Optional[str] = None
    created_at: str = Field(default_factory=_utc_now_iso)
    processed_at: Optional[str] = None
