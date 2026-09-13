"""Unified Mission Manager: Integrates Dynamic DAG, Collaborative Workers, and Guardian Guardrails."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field

from services.agent_runtime.collaboration import (
    DeliberationEngine,
    MessageType,
    MissionBlackboard,
    WorkerMessage,
)
from services.agent_runtime.worker import WorkerManager
from services.guardian.file_guard import FileGuard, GuardrailSecurityViolation
from services.guardian.gate_manager import GateManager
from services.orchestrator.dag_engine import DAGGraph, DAGNode, TaskStatus


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MissionExecutionState(BaseModel):
    """Complete in-memory / persistent state for an active mission."""
    mission_id: str
    title: str
    prompt: str
    workspace_id: str = "default"
    status: str = "planning"  # "planning", "debating", "executing", "paused", "completed", "failed"
    dag: DAGGraph
    blackboard: MissionBlackboard
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)


class MissionManager:
    """Core runtime engine driving multi-worker missions through dynamic DAG execution,
    deliberative team debate, and security policy checks.
    """

    def __init__(
        self,
        worker_manager: Optional[WorkerManager] = None,
        gate_manager: Optional[GateManager] = None,
    ):
        self.worker_manager = worker_manager or WorkerManager()
        self.gate_manager = gate_manager or GateManager()
        self._active_missions: Dict[str, MissionExecutionState] = {}

    def create_mission(
        self,
        title: str,
        prompt: str,
        workspace_id: str = "default",
        mission_id: Optional[str] = None,
    ) -> MissionExecutionState:
        """Initializes a new mission with its dedicated DAG graph and shared team blackboard."""
        mid = mission_id or f"mission-{uuid.uuid4().hex[:8]}"
        dag = DAGGraph(mission_id=mid)
        blackboard = MissionBlackboard(mission_id=mid)

        # Initial coordinator note
        blackboard.post_message(
            sender_worker_id="worker-system-coordinator",
            sender_role="coordinator",
            message_type=MessageType.PROPOSAL,
            content=f"Mission initialized: '{title}'. Goal: {prompt}",
        )

        state = MissionExecutionState(
            mission_id=mid,
            title=title,
            prompt=prompt,
            workspace_id=workspace_id,
            status="planning",
            dag=dag,
            blackboard=blackboard,
        )
        self._active_missions[mid] = state
        return state

    def get_mission(self, mission_id: str) -> Optional[MissionExecutionState]:
        return self._active_missions.get(mission_id)

    def populate_dag_nodes(
        self,
        mission_id: str,
        nodes: List[DAGNode],
    ) -> DAGGraph:
        """Populates the mission's DAG graph with dynamic task nodes."""
        state = self._get_mission_or_raise(mission_id)
        for node in nodes:
            state.dag.add_node(node)
        state.updated_at = _utc_now_iso()
        return state.dag

    def run_plan_debate(
        self,
        mission_id: str,
        coordinator_plan: str,
        critique_fn: Callable[[str], str],
        refinement_fn: Callable[[str, str], str],
    ) -> str:
        """Executes the human-like multi-worker debate loop before execution begins."""
        state = self._get_mission_or_raise(mission_id)
        state.status = "debating"
        engine = DeliberationEngine(state.blackboard)
        refined = engine.run_plan_debate(
            coordinator_plan=coordinator_plan,
            critique_fn=critique_fn,
            refinement_fn=refinement_fn,
        )
        state.status = "executing"
        state.updated_at = _utc_now_iso()
        return refined

    def execute_ready_node(
        self,
        mission_id: str,
        node_id: str,
        tool: str,
        tool_args: Dict[str, Any],
        worker_id: Optional[str] = None,
        execute_fn: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Executes a ready DAG node, validating Guardian security boundaries and approval gates."""
        state = self._get_mission_or_raise(mission_id)
        node = state.dag.nodes.get(node_id)
        if not node:
            raise KeyError(f"Node '{node_id}' not found in mission DAG.")

        # 1. Guardian Sensitive File Shield: Check file arguments
        path_arg = tool_args.get("path") or tool_args.get("TargetFile") or tool_args.get("file_path")
        if path_arg and FileGuard.is_sensitive_path(path_arg):
            node.status = TaskStatus.FAILED
            node.error = f"Security Violation: Attempted access to sensitive file '{path_arg}' blocked by Guardian."
            state.blackboard.post_message(
                sender_worker_id="system-guardian",
                sender_role="guardian",
                message_type=MessageType.VERIFICATION_REPORT,
                content=node.error,
            )
            return {"status": "blocked_by_guardian", "error": node.error}

        # 2. Guardian Action Risk & Approval Gate Evaluation
        intercept = self.gate_manager.evaluate_and_intercept(
            route_id=mission_id,
            step_num=int(node_id.replace("node-", "").replace("n", "") or 1) if node_id.replace("node-", "").replace("n", "").isdigit() else 1,
            tool=tool,
            args=tool_args,
            workspace_id=state.workspace_id,
            action_summary=f"Task: {node.title} — Tool: {tool}",
        )

        if intercept["status"] == "pending":
            state.status = "paused"
            node.status = TaskStatus.RUNNING
            state.blackboard.post_message(
                sender_worker_id="system-guardian",
                sender_role="guardian",
                message_type=MessageType.DEBATE,
                content=f"Approval Gate required for '{tool}'. Execution paused awaiting user approval.",
                metadata={"gate_id": intercept["gate_id"]},
            )
            return {
                "status": "approval_required",
                "gate_id": intercept["gate_id"],
                "node_id": node_id,
            }

        # 3. Execution Approved — Run node
        state.dag.mark_node_running(node_id, worker_id=worker_id)
        try:
            if execute_fn:
                output = execute_fn(tool_args)
            else:
                output = {"success": True, "message": f"Task '{node.title}' executed with tool {tool}"}

            summary = output.get("message") or "Completed successfully"
            artifacts = output.get("artifacts") or []
            state.dag.mark_node_completed(node_id, result_summary=summary, output_artifacts=artifacts)

            state.blackboard.post_message(
                sender_worker_id=worker_id or node.assigned_worker_id or "worker-system-developer",
                sender_role=node.assigned_role,
                message_type=MessageType.EXECUTION_RESULT,
                content=f"Completed node '{node.title}': {summary}",
                artifacts=artifacts,
            )

            # Check if all nodes finished
            if state.dag.is_finished():
                engine = DeliberationEngine(state.blackboard)
                engine.sign_off_mission(summary=f"Mission '{state.title}' completed all DAG steps.")
                state.status = "completed"

            state.updated_at = _utc_now_iso()
            return {"status": "completed", "node_id": node_id, "output": output}

        except Exception as exc:
            state.dag.mark_node_failed(node_id, error=str(exc))
            state.updated_at = _utc_now_iso()
            return {"status": "failed", "node_id": node_id, "error": str(exc)}

    def resolve_mission_gate(
        self,
        mission_id: str,
        gate_id: str,
        approved: bool,
        allow_future_automation: bool = False,
    ) -> Dict[str, Any]:
        """Resolves an approval gate and unpauses mission execution."""
        state = self._get_mission_or_raise(mission_id)
        resolved = self.gate_manager.resolve_gate(
            gate_id=gate_id,
            approved=approved,
            allow_future_automation=allow_future_automation,
            workspace_id=state.workspace_id,
        )

        if approved:
            state.status = "executing"
            state.blackboard.post_message(
                sender_worker_id="user",
                sender_role="human_operator",
                message_type=MessageType.MANAGER_SIGN_OFF,
                content=f"Approval Gate '{gate_id}' APPROVED. Resuming mission execution.",
            )
        else:
            state.status = "failed"
            state.blackboard.post_message(
                sender_worker_id="user",
                sender_role="human_operator",
                message_type=MessageType.DEBATE,
                content=f"Approval Gate '{gate_id}' REJECTED by user. Mission execution halted.",
            )

        state.updated_at = _utc_now_iso()
        return {"status": "resolved", "approved": approved, "gate": resolved}

    def _get_mission_or_raise(self, mission_id: str) -> MissionExecutionState:
        state = self.get_mission(mission_id)
        if not state:
            raise KeyError(f"Mission '{mission_id}' not found.")
        return state


__all__ = ["MissionExecutionState", "MissionManager"]
