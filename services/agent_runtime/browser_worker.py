"""Autonomous OS Browser Worker: 48-Hour Activity Synthesis & Morning Executive Briefing."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BrowserHistoryEntry(BaseModel):
    """Represents a visited page or tab from a signed-in user account."""
    url: str
    title: str
    timestamp: str = Field(default_factory=_utc_now_iso)
    account_id: str
    category: str = "general"  # "docs", "research", "dashboard", "communication", "code"


class MorningBriefingContext(BaseModel):
    """Holistic Autonomous OS context aggregated for morning resumption."""
    user_id: str
    workspace_id: str = "default"
    permission_granted: bool = False
    signed_in_account: Optional[str] = None
    browser_history_48h: List[BrowserHistoryEntry] = Field(default_factory=list)
    open_tabs: List[Dict[str, str]] = Field(default_factory=list)
    active_missions: List[Dict[str, Any]] = Field(default_factory=list)
    pending_gates: List[Dict[str, Any]] = Field(default_factory=list)
    workspace_git_summary: Optional[str] = None


class MorningBriefing(BaseModel):
    """Executive briefing presented to user when launching Bee."""
    executive_summary: str
    browser_research_summary: str
    active_missions_summary: str
    pending_approvals_count: int
    pending_approvals: List[Dict[str, Any]] = Field(default_factory=list)
    workspace_summary: str
    recommended_next_steps: List[str] = Field(default_factory=list)
    generated_at: str = Field(default_factory=_utc_now_iso)


class BrowserWorker:
    """Autonomous OS worker specialized in synthesizing cross-domain activity into morning briefings."""

    @classmethod
    def filter_last_48_hours(
        cls,
        entries: List[BrowserHistoryEntry],
        reference_time: Optional[datetime] = None,
    ) -> List[BrowserHistoryEntry]:
        """Filters browser history to only include items from the last 48 hours."""
        ref = reference_time or datetime.now(timezone.utc)
        cutoff = ref - timedelta(hours=48)

        valid_entries: List[BrowserHistoryEntry] = []
        for entry in entries:
            try:
                entry_dt = datetime.fromisoformat(entry.timestamp)
                if entry_dt.tzinfo is None:
                    entry_dt = entry_dt.replace(tzinfo=timezone.utc)
                if entry_dt >= cutoff:
                    valid_entries.append(entry)
            except Exception:
                # If parsing fails, exclude for security/validity
                continue
        return valid_entries

    @classmethod
    def generate_morning_briefing(cls, context: MorningBriefingContext) -> MorningBriefing:
        """Synthesizes browser history (if permitted), missions, approval gates, and workspace state."""
        # 1. Handle Permission and Signed-in Account Requirement
        if not context.permission_granted or not context.signed_in_account:
            browser_summary = (
                "🔒 Browser history access is currently disabled or no account is signed in. "
                "Grant permission in Settings -> Connected Accounts to enable 48-hour history resumption."
            )
            filtered_history: List[BrowserHistoryEntry] = []
        else:
            filtered_history = cls.filter_last_48_hours(context.browser_history_48h)
            if filtered_history:
                topics = set(e.title for e in filtered_history[:8])
                browser_summary = (
                    f"Examined {len(filtered_history)} activities across signed-in account ({context.signed_in_account}). "
                    f"Key focus topics in last 48h: {', '.join(list(topics)[:4])}."
                )
            else:
                browser_summary = "No browser activity recorded in the last 48 hours for this signed-in account."

        # 2. Active Missions Summary
        if context.active_missions:
            mission_titles = [m.get("title") or m.get("name") or m.get("id") for m in context.active_missions[:3]]
            missions_summary = f"{len(context.active_missions)} mission(s) in progress: {', '.join(filter(None, mission_titles))}."
        else:
            missions_summary = "No active missions currently in flight."

        # 3. Pending Approvals
        pending_count = len(context.pending_gates)

        # 4. Workspace State
        ws_summary = context.workspace_git_summary or "Workspace clean; no uncommitted changes."

        # 5. Build Recommendations
        recommendations: List[str] = []
        if pending_count > 0:
            recommendations.append(f"Review and resolve {pending_count} pending approval gate(s) to unblock paused workers.")
        if context.active_missions:
            recommendations.append("Continue executing in-flight missions from where workers left off.")
        if filtered_history:
            recommendations.append(f"Resume research on: {filtered_history[0].title}")
        if not recommendations:
            recommendations.append("Ready for new missions or inquiries. What would you like to build today?")

        # 6. Executive Summary
        exec_summary = (
            f"Good morning! Here is where you left off. "
            f"You have {len(context.active_missions)} active mission(s), {pending_count} action(s) waiting for approval, "
            f"and {len(context.open_tabs)} open tab(s)."
        )

        return MorningBriefing(
            executive_summary=exec_summary,
            browser_research_summary=browser_summary,
            active_missions_summary=missions_summary,
            pending_approvals_count=pending_count,
            pending_approvals=context.pending_gates,
            workspace_summary=ws_summary,
            recommended_next_steps=recommendations,
        )


__all__ = [
    "BrowserHistoryEntry",
    "BrowserWorker",
    "MorningBriefing",
    "MorningBriefingContext",
]
