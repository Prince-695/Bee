"""Unit tests for BrowserWorker 48-hour history synthesis and Autonomous OS morning briefing."""

from datetime import datetime, timedelta, timezone
import pytest
from services.agent_runtime.browser_worker import (
    BrowserHistoryEntry,
    BrowserWorker,
    MorningBriefingContext,
)


def test_permission_required_for_browser_history():
    """Verify browser history is withheld when permission is not granted or account is not signed in."""
    ctx = MorningBriefingContext(
        user_id="usr-1",
        permission_granted=False,
        signed_in_account=None,
        browser_history_48h=[
            BrowserHistoryEntry(url="https://stripe.com/docs", title="Stripe API Docs", account_id="usr-1"),
        ],
    )
    briefing = BrowserWorker.generate_morning_briefing(ctx)
    assert "Browser history access is currently disabled" in briefing.browser_research_summary
    assert "Stripe API Docs" not in briefing.browser_research_summary


def test_filter_last_48_hours():
    """Verify that only activities from the last 48 hours are retained."""
    now = datetime.now(timezone.utc)
    recent = (now - timedelta(hours=12)).isoformat()
    yesterday = (now - timedelta(hours=36)).isoformat()
    old_3days = (now - timedelta(hours=72)).isoformat()

    entries = [
        BrowserHistoryEntry(url="https://recent.com", title="Recent Article", timestamp=recent, account_id="u1"),
        BrowserHistoryEntry(url="https://yesterday.com", title="Yesterday Docs", timestamp=yesterday, account_id="u1"),
        BrowserHistoryEntry(url="https://old.com", title="Old History", timestamp=old_3days, account_id="u1"),
    ]

    filtered = BrowserWorker.filter_last_48_hours(entries, reference_time=now)
    assert len(filtered) == 2
    titles = [e.title for e in filtered]
    assert "Recent Article" in titles
    assert "Yesterday Docs" in titles
    assert "Old History" not in titles


def test_autonomous_os_morning_briefing_synthesis():
    """Verify synthesis across browser history, missions, approval gates, and workspace state."""
    now = datetime.now(timezone.utc)
    recent = (now - timedelta(hours=6)).isoformat()

    ctx = MorningBriefingContext(
        user_id="usr-exec",
        workspace_id="ws-main",
        permission_granted=True,
        signed_in_account="engineer@company.com",
        browser_history_48h=[
            BrowserHistoryEntry(url="https://github.com/org/repo/pull/12", title="PR #12 Review", timestamp=recent, account_id="engineer@company.com"),
            BrowserHistoryEntry(url="https://neon.tech/docs", title="Neon Postgres Serverless", timestamp=recent, account_id="engineer@company.com"),
        ],
        open_tabs=[{"url": "https://localhost:8000/docs", "title": "API Docs"}],
        active_missions=[
            {"id": "mis-1", "title": "Implement Payment Integration"},
            {"id": "mis-2", "title": "Refactor Database Repositories"},
        ],
        pending_gates=[
            {"gate_id": "gate-1", "tool": "git_push", "action_summary": "Push changes to origin/main"},
        ],
        workspace_git_summary="On branch V1. 2 modified files ready for commit.",
    )

    briefing = BrowserWorker.generate_morning_briefing(ctx)

    # Check Executive Summary
    assert "Good morning!" in briefing.executive_summary
    assert "2 active mission(s)" in briefing.executive_summary
    assert "1 action(s) waiting for approval" in briefing.executive_summary

    # Check Browser Summary
    assert "PR #12 Review" in briefing.browser_research_summary
    assert "engineer@company.com" in briefing.browser_research_summary

    # Check Missions
    assert "Payment Integration" in briefing.active_missions_summary

    # Check Recommendations
    assert any("pending approval gate" in r for r in briefing.recommended_next_steps)
    assert any("in-flight missions" in r for r in briefing.recommended_next_steps)
