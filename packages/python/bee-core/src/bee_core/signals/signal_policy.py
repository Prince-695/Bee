"""Signal Policy Engine: matches engineering signals to autonomous Flight objectives."""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from bee_core.signals.signal_model import EngineeringSignal


class SignalPolicyEngine:
    """Evaluates incoming engineering signals against automation policies."""

    @staticmethod
    def evaluate_signal(signal: EngineeringSignal) -> Optional[Dict[str, Any]]:
        source = signal.source.lower()
        event_type = signal.event_type.lower()
        repo = signal.repository
        branch = signal.branch or "main"
        payload = signal.payload or {}

        # 1. Pull Request Events -> Review & Edge-Case Inspection Flight
        if source == "github" and ("pr_" in event_type or event_type == "pull_request"):
            action = payload.get("action", "opened")
            pr_title = payload.get("pull_request", {}).get("title") or payload.get("pr_title", "PR")
            pr_num = payload.get("pull_request", {}).get("number") or payload.get("pr_number", "42")
            return {
                "policy_name": "pr_autonomous_inspection",
                "mission_id": f"msn_pr_{pr_num}_{uuid.uuid4().hex[:6]}",
                "objective": f"Inspect pull request #{pr_num} ('{pr_title}') on branch '{branch}'. Run local test suites with sandbox, search modified files with code_search, and generate an evidence-based review.",
                "context": {
                    "source": source,
                    "repo": repo,
                    "branch": branch,
                    "pr_number": pr_num,
                },
            }

        # 2. CI/CD Failure Events -> Auto-Heal Flight
        if event_type == "ci_failure" or source == "ci":
            error_log = payload.get("error_log") or payload.get("step") or "Test suite failure"
            return {
                "policy_name": "ci_failure_auto_heal",
                "mission_id": f"msn_ci_{uuid.uuid4().hex[:8]}",
                "objective": f"Diagnose CI failure on branch '{branch}' ({error_log}). Run pytest/vitest in sandbox, inspect failures with ripgrep, and execute self-healing remediation.",
                "context": {
                    "source": source,
                    "repo": repo,
                    "branch": branch,
                    "error_log": error_log,
                },
            }

        # 3. Sentry / Incident Alerts -> Root Cause Investigation Flight
        if source == "sentry" or event_type == "alert":
            culprit = payload.get("culprit") or payload.get("message") or "Application Error"
            return {
                "policy_name": "incident_root_cause_investigation",
                "mission_id": f"msn_sentry_{uuid.uuid4().hex[:8]}",
                "objective": f"Investigate Sentry incident '{culprit}' on repository '{repo}'. Find affected symbols with code_ripgrep, locate stack trace source, and verify remediation.",
                "context": {
                    "source": source,
                    "repo": repo,
                    "culprit": culprit,
                },
            }

        return None
