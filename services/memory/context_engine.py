"""Context Engine: Holistically synthesizes multi-source workspace context, memory graph, and morning briefings."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict, List, Optional
from pydantic import BaseModel, Field

from services.agent_runtime.browser_worker import (
    BrowserHistoryEntry,
    BrowserWorker,
    MorningBriefing,
    MorningBriefingContext,
)
from services.memory.models import MemoryScope, MemoryType, _utc_now_iso

if TYPE_CHECKING:
    from services.data.repositories.gate_repo import GateRepository
    from services.data.repositories.memory_repo import MemoryRepository
    from services.data.repositories.mission_repo import MissionRepository


class ContextSynthesisResult(BaseModel):
    """Complete synthesized multi-source context bundle."""
    workspace_id: str
    user_id: Optional[str] = None
    git_summary: Optional[str] = None
    active_missions: List[Dict[str, Any]] = Field(default_factory=list)
    pending_approvals: List[Dict[str, Any]] = Field(default_factory=list)
    recent_memories: List[Dict[str, Any]] = Field(default_factory=list)
    recent_remediations: List[Dict[str, Any]] = Field(default_factory=list)
    morning_briefing: Optional[MorningBriefing] = None
    synthesized_at: str = Field(default_factory=_utc_now_iso)


class ContextEngine:
    """Core synthesizer aggregating relational state, memory graph, and activity feeds."""

    def __init__(
        self,
        memory_repo: Optional[Any] = None,
        mission_repo: Optional[Any] = None,
        gate_repo: Optional[Any] = None,
    ):
        if memory_repo is None:
            from services.data.repositories.memory_repo import MemoryRepository
            self.memory_repo = MemoryRepository()
        else:
            self.memory_repo = memory_repo

        if mission_repo is None:
            from services.data.repositories.mission_repo import MissionRepository
            self.mission_repo = MissionRepository()
        else:
            self.mission_repo = mission_repo

        if gate_repo is None:
            from services.data.repositories.gate_repo import GateRepository
            self.gate_repo = GateRepository()
        else:
            self.gate_repo = gate_repo

    async def synthesize_workspace_context(
        self,
        tenant_id: str,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        git_summary: Optional[str] = None,
        browser_history: Optional[List[BrowserHistoryEntry]] = None,
        browser_permission_granted: bool = False,
        signed_in_account: Optional[str] = None,
    ) -> ContextSynthesisResult:
        """Aggregates all active context: missions, gates, memories, remediations, and morning briefing."""
        # 1. Fetch pending gates
        gates = self.gate_repo.list_gates(status="pending")

        # 2. Fetch active missions
        missions = self.mission_repo.list_missions(limit=5)

        # 3. Fetch recent memories
        recent_mems = await self.memory_repo.list_memories(
            tenant_id=tenant_id,
            project_id=project_id,
            limit=5,
        )

        # 4. Fetch recent remediations
        remediations = await self.memory_repo.list_remediations(
            tenant_id=tenant_id,
            limit=3,
        )

        # 5. Build MorningBriefingContext
        mb_context = MorningBriefingContext(
            user_id=user_id or "default_user",
            workspace_id=tenant_id,
            permission_granted=browser_permission_granted,
            signed_in_account=signed_in_account,
            browser_history_48h=browser_history or [],
            open_tabs=[],
            active_missions=[m if isinstance(m, dict) else dict(m) for m in missions],
            pending_gates=gates,
            workspace_git_summary=git_summary,
        )

        # 6. Generate Morning Briefing
        briefing = BrowserWorker.generate_morning_briefing(mb_context)

        # Enrich briefing recommendations with recent remediations and memory lessons
        if remediations:
            top_rem = remediations[0]
            briefing.recommended_next_steps.append(
                f"Past verified lesson available: '{top_rem.problem_signature}' has verified self-healing patch."
            )

        return ContextSynthesisResult(
            workspace_id=tenant_id,
            user_id=user_id,
            git_summary=git_summary,
            active_missions=[m if isinstance(m, dict) else dict(m) for m in missions],
            pending_approvals=gates,
            recent_memories=[m.model_dump() for m in recent_mems],
            recent_remediations=[r.model_dump() for r in remediations],
            morning_briefing=briefing,
        )
