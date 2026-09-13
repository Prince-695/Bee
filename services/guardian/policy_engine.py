"""Enterprise Policy Engine for Action Risk Scoring & Autonomous Guardrails."""

from __future__ import annotations

import re
from enum import Enum
from typing import Any, Dict, Optional, Set
from pydantic import BaseModel, Field


class ActionRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PolicyEvaluationResult(BaseModel):
    tool: str
    risk_level: ActionRiskLevel
    requires_approval: bool
    reason: str
    auto_approved: bool = False
    automation_rule_matched: Optional[str] = None


class PolicyEngine:
    """Evaluates agent tool calls, scores operational risk, and enforces human-in-the-loop gates.
    
    Default security stance: High and critical operations REQUIRE human approval
    until explicitly permitted by the user for automated execution.
    """

    # Tools classified as low risk (safe observation, search, reads)
    LOW_RISK_TOOLS: Set[str] = {
        "read_file",
        "list_dir",
        "search_web",
        "view_file",
        "grep_search",
        "get_git_status",
        "get_git_log",
        "query_documentation",
        "inspect_browser_history",
    }

    # Tools classified as medium risk (local workspace writes, running tests)
    MEDIUM_RISK_TOOLS: Set[str] = {
        "write_to_file",
        "replace_file_content",
        "multi_replace_file_content",
        "run_test",
        "format_code",
        "git_commit",
        "git_checkout",
    }

    # Patterns indicating critical destructive commands in shell executions
    CRITICAL_SHELL_PATTERNS = [
        re.compile(r"\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f?|-f[a-zA-Z]*r)\s+", re.IGNORECASE),
        re.compile(r"\b(mkfs|dd\s+if=|fdisk|parted)\b", re.IGNORECASE),
        re.compile(r"\b(shutdown|reboot|poweroff|init\s+0)\b", re.IGNORECASE),
        re.compile(r"\bgit\s+(push\s+--force|reset\s+--hard|clean\s+-fdx)\b", re.IGNORECASE),
        re.compile(r"\b(drop\s+database|drop\s+table|truncate\s+table)\b", re.IGNORECASE),
    ]

    # Workspace-level automation rules: { "workspace_id": { "tool_or_pattern": True } }
    _automation_rules: Dict[str, Dict[str, bool]] = {}

    @classmethod
    def set_automation_permission(cls, workspace_id: str, rule_key: str, allowed: bool = True) -> None:
        """Grants or revokes explicit automation permission for a specific tool or action in a workspace."""
        if workspace_id not in cls._automation_rules:
            cls._automation_rules[workspace_id] = {}
        cls._automation_rules[workspace_id][rule_key] = allowed

    @classmethod
    def is_automation_permitted(cls, workspace_id: str, rule_key: str) -> bool:
        """Checks if the user has granted autonomous permission for this action."""
        rules = cls._automation_rules.get(workspace_id, {})
        return rules.get(rule_key, False) or rules.get("*", False)

    @classmethod
    def clear_automation_rules(cls, workspace_id: Optional[str] = None) -> None:
        """Resets automation permissions."""
        if workspace_id:
            cls._automation_rules.pop(workspace_id, None)
        else:
            cls._automation_rules.clear()

    @classmethod
    def evaluate_action(
        cls,
        tool: str,
        args: Optional[Dict[str, Any]] = None,
        workspace_id: str = "default",
    ) -> PolicyEvaluationResult:
        """Evaluates an action and returns risk assessment and approval requirement."""
        args = args or {}
        tool_clean = tool.lower().strip()

        # 1. Check for Critical Shell Commands
        if tool_clean in ("run_command", "bash", "terminal", "exec"):
            cmd = str(args.get("command") or args.get("CommandLine") or "")
            for pattern in cls.CRITICAL_SHELL_PATTERNS:
                if pattern.search(cmd):
                    rule_key = f"shell_critical:{cmd.split()[0]}"
                    if cls.is_automation_permitted(workspace_id, rule_key):
                        return PolicyEvaluationResult(
                            tool=tool,
                            risk_level=ActionRiskLevel.CRITICAL,
                            requires_approval=False,
                            reason="Critical shell command permitted by user automation policy",
                            auto_approved=True,
                            automation_rule_matched=rule_key,
                        )
                    return PolicyEvaluationResult(
                        tool=tool,
                        risk_level=ActionRiskLevel.CRITICAL,
                        requires_approval=True,
                        reason=f"Critical destructive shell command requires explicit human permission: '{cmd[:60]}...'",
                    )

            # Standard shell commands are High Risk
            rule_key = "run_command"
            if cls.is_automation_permitted(workspace_id, rule_key):
                return PolicyEvaluationResult(
                    tool=tool,
                    risk_level=ActionRiskLevel.HIGH,
                    requires_approval=False,
                    reason="Shell execution permitted by user automation policy",
                    auto_approved=True,
                    automation_rule_matched=rule_key,
                )
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.HIGH,
                requires_approval=True,
                reason="Shell command execution requires human approval until granted for automation",
            )

        # 2. Remote git pushes or deployments are High Risk
        if "git_push" in tool_clean or "deploy" in tool_clean:
            rule_key = tool_clean
            if cls.is_automation_permitted(workspace_id, rule_key):
                return PolicyEvaluationResult(
                    tool=tool,
                    risk_level=ActionRiskLevel.HIGH,
                    requires_approval=False,
                    reason=f"{tool} permitted by user automation policy",
                    auto_approved=True,
                    automation_rule_matched=rule_key,
                )
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.HIGH,
                requires_approval=True,
                reason=f"Publishing/Deployment action '{tool}' requires human approval",
            )

        # 3. External communications & messaging
        if any(msg in tool_clean for msg in ("send_email", "send_whatsapp", "send_slack", "charge_payment")):
            rule_key = tool_clean
            if cls.is_automation_permitted(workspace_id, rule_key):
                return PolicyEvaluationResult(
                    tool=tool,
                    risk_level=ActionRiskLevel.HIGH,
                    requires_approval=False,
                    reason=f"External send '{tool}' permitted by automation policy",
                    auto_approved=True,
                    automation_rule_matched=rule_key,
                )
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.HIGH,
                requires_approval=True,
                reason=f"External side-effect '{tool}' requires human approval",
            )

        # 4. Low Risk Tools
        if tool_clean in cls.LOW_RISK_TOOLS:
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.LOW,
                requires_approval=False,
                reason="Safe read/inspect action auto-approved",
                auto_approved=True,
            )

        # 5. Medium Risk Tools
        if tool_clean in cls.MEDIUM_RISK_TOOLS:
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.MEDIUM,
                requires_approval=False,
                reason="Safe local workspace modification auto-approved",
                auto_approved=True,
            )

        # 6. Default fallback for unknown tools: require approval
        if cls.is_automation_permitted(workspace_id, tool_clean):
            return PolicyEvaluationResult(
                tool=tool,
                risk_level=ActionRiskLevel.MEDIUM,
                requires_approval=False,
                reason="Tool permitted by user automation policy",
                auto_approved=True,
                automation_rule_matched=tool_clean,
            )

        return PolicyEvaluationResult(
            tool=tool,
            risk_level=ActionRiskLevel.HIGH,
            requires_approval=True,
            reason=f"Unclassified tool '{tool}' requires human approval by default",
        )
