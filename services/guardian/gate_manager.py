"""Interactive Gate Manager for Human-In-The-Loop Approval and Policy Enforcement."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from services.data.repositories.gate_repo import GateRepository
from services.guardian.policy_engine import ActionRiskLevel, PolicyEngine, PolicyEvaluationResult


class GateManager:
    """Manages the interception, queuing, and resolution of sensitive worker actions."""

    def __init__(self, gate_repo: Optional[GateRepository] = None):
        self.repo = gate_repo or GateRepository()
        self.repo.init_db()

    def evaluate_and_intercept(
        self,
        route_id: str,
        step_num: int,
        tool: str,
        args: Optional[Dict[str, Any]] = None,
        workspace_id: str = "default",
        action_summary: str = "",
        server: str = "system",
    ) -> Dict[str, Any]:
        """Evaluates an action. If human approval is required, creates an approval gate and pauses.
        
        Returns:
            dict containing:
                "status": "approved" | "pending"
                "gate_id": str (if pending)
                "evaluation": PolicyEvaluationResult
        """
        args = args or {}
        evaluation: PolicyEvaluationResult = PolicyEngine.evaluate_action(
            tool=tool,
            args=args,
            workspace_id=workspace_id,
        )

        if not evaluation.requires_approval:
            return {
                "status": "approved",
                "auto_approved": True,
                "evaluation": evaluation.model_dump(),
            }

        # Action requires human approval — create gate in database
        summary = action_summary or evaluation.reason
        gate = self.repo.create_gate(
            route_id=route_id,
            step_num=step_num,
            server=server,
            tool=tool,
            args=args,
            action_summary=summary,
        )

        return {
            "status": "pending",
            "gate_id": gate["gate_id"],
            "auto_approved": False,
            "evaluation": evaluation.model_dump(),
            "gate": gate,
        }

    def resolve_gate(
        self,
        gate_id: str,
        approved: bool,
        allow_future_automation: bool = False,
        workspace_id: str = "default",
    ) -> Optional[Dict[str, Any]]:
        """Resolves an approval gate. If allow_future_automation is True, permits future actions of this type."""
        status_str = "approved" if approved else "rejected"
        resolved = self.repo.resolve_gate(gate_id=gate_id, approved=status_str)

        if approved and allow_future_automation and resolved:
            tool = resolved.get("tool")
            if tool:
                # Store automation permission so subsequent tasks do not prompt again
                PolicyEngine.set_automation_permission(
                    workspace_id=workspace_id,
                    rule_key=tool.lower().strip(),
                    allowed=True,
                )

        return resolved

    def get_gate(self, gate_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_gate(gate_id=gate_id)

    def list_pending_gates(self, route_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repo.list_gates(route_id=route_id, status="pending")
