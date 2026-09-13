"""Human-Like Multi-Worker Deliberation Engine & Shared Mission Blackboard."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MessageType(str, Enum):
    PROPOSAL = "proposal"
    DEBATE = "debate"
    REFINEMENT = "refinement"
    EXECUTION_RESULT = "execution_result"
    VERIFICATION_REPORT = "verification_report"
    MODIFICATION_REQUEST = "modification_request"
    MANAGER_SIGN_OFF = "manager_sign_off"


class WorkerMessage(BaseModel):
    """An inter-worker message or critique published to the mission blackboard."""
    id: str = Field(default_factory=lambda: f"msg-{uuid.uuid4().hex[:8]}")
    mission_id: str
    sender_worker_id: str
    sender_role: str
    recipient_role: Optional[str] = None  # None indicates broadcast to whole team
    message_type: MessageType
    content: str
    artifacts: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=_utc_now_iso)


class MissionBlackboard(BaseModel):
    """Shared team blackboard where workers post proposals, debate, share artifacts, and review work."""
    mission_id: str
    messages: List[WorkerMessage] = Field(default_factory=list)
    shared_artifacts: Dict[str, Any] = Field(default_factory=dict)
    current_stage: str = "planning"
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)

    def post_message(
        self,
        sender_worker_id: str,
        sender_role: str,
        message_type: MessageType,
        content: str,
        recipient_role: Optional[str] = None,
        artifacts: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> WorkerMessage:
        """Posts a new message or critique to the shared mission blackboard."""
        msg = WorkerMessage(
            mission_id=self.mission_id,
            sender_worker_id=sender_worker_id,
            sender_role=sender_role,
            recipient_role=recipient_role,
            message_type=message_type,
            content=content,
            artifacts=artifacts or [],
            metadata=metadata or {},
        )
        self.messages.append(msg)
        self.updated_at = _utc_now_iso()
        return msg

    def get_messages(
        self,
        message_type: Optional[MessageType] = None,
        recipient_role: Optional[str] = None,
    ) -> List[WorkerMessage]:
        """Filters messages by type or recipient role."""
        results = self.messages
        if message_type:
            results = [m for m in results if m.message_type == message_type]
        if recipient_role:
            results = [m for m in results if m.recipient_role in (None, recipient_role)]
        return results

    def publish_artifact(self, name: str, data: Any) -> None:
        """Stores a shared artifact (e.g. code diff, research note, test report) on the blackboard."""
        self.shared_artifacts[name] = data
        self.updated_at = _utc_now_iso()

    def get_artifact(self, name: str) -> Optional[Any]:
        return self.shared_artifacts.get(name)


class DeliberationEngine:
    """Executes the human-like team workflow: Plan -> Debate/Argue -> Refine -> Execute -> Test -> Modify -> Sign-off."""

    def __init__(self, blackboard: MissionBlackboard):
        self.blackboard = blackboard

    def run_plan_debate(
        self,
        coordinator_plan: str,
        critique_fn: Callable[[str], str],
        refinement_fn: Callable[[str, str], str],
        coordinator_id: str = "worker-system-coordinator",
        reviewer_id: str = "worker-system-reviewer",
    ) -> str:
        """Step 1 & 2: Coordinator proposes a plan, Reviewer critiques, Coordinator refines."""
        self.blackboard.current_stage = "debating"

        # 1. Coordinator posts plan proposal
        self.blackboard.post_message(
            sender_worker_id=coordinator_id,
            sender_role="coordinator",
            message_type=MessageType.PROPOSAL,
            content=coordinator_plan,
        )

        # 2. Reviewer debates and critiques the proposal
        critique = critique_fn(coordinator_plan)
        self.blackboard.post_message(
            sender_worker_id=reviewer_id,
            sender_role="reviewer",
            recipient_role="coordinator",
            message_type=MessageType.DEBATE,
            content=critique,
        )

        # 3. Coordinator refines plan incorporating the debate
        refined_plan = refinement_fn(coordinator_plan, critique)
        self.blackboard.post_message(
            sender_worker_id=coordinator_id,
            sender_role="coordinator",
            message_type=MessageType.REFINEMENT,
            content=refined_plan,
        )

        self.blackboard.publish_artifact("approved_plan", refined_plan)
        return refined_plan

    def run_execute_test_modify_loop(
        self,
        task_title: str,
        execute_fn: Callable[[int, Optional[str]], Dict[str, Any]],
        verify_fn: Callable[[Dict[str, Any]], Dict[str, Any]],
        developer_id: str = "worker-system-developer",
        reviewer_id: str = "worker-system-reviewer",
        max_iterations: int = 3,
    ) -> Dict[str, Any]:
        """Step 3 & 4: Developer executes work, Reviewer tests.

        If verification fails, Reviewer requests modification with specific errors,
        and Developer modifies the work until passed or max iterations reached.
        """
        self.blackboard.current_stage = "executing"
        last_critique: Optional[str] = None
        iteration = 1

        while iteration <= max_iterations:
            # Developer executes or modifies
            result = execute_fn(iteration, last_critique)
            self.blackboard.post_message(
                sender_worker_id=developer_id,
                sender_role="developer",
                message_type=MessageType.EXECUTION_RESULT,
                content=f"Executed task '{task_title}' (iteration {iteration})",
                artifacts=result.get("artifacts", []),
                metadata={"iteration": iteration},
            )

            # Reviewer verifies and tests
            self.blackboard.current_stage = "verifying"
            verification = verify_fn(result)
            passed = bool(verification.get("passed", False))
            feedback = verification.get("feedback", "No feedback provided")

            if passed:
                self.blackboard.post_message(
                    sender_worker_id=reviewer_id,
                    sender_role="reviewer",
                    message_type=MessageType.VERIFICATION_REPORT,
                    content=f"Verification PASSED for '{task_title}': {feedback}",
                    metadata={"passed": True, "iteration": iteration},
                )
                self.blackboard.publish_artifact(f"{task_title}_result", result)
                return {"passed": True, "iterations": iteration, "result": result, "verification": verification}

            # Verification failed — Reviewer demands modification
            self.blackboard.current_stage = "modifying"
            last_critique = feedback
            self.blackboard.post_message(
                sender_worker_id=reviewer_id,
                sender_role="reviewer",
                recipient_role="developer",
                message_type=MessageType.MODIFICATION_REQUEST,
                content=f"Verification FAILED (iteration {iteration}): {feedback}. Modifications required.",
                metadata={"passed": False, "iteration": iteration},
            )
            iteration += 1

        return {
            "passed": False,
            "iterations": max_iterations,
            "error": f"Max iterations ({max_iterations}) exceeded without passing verification.",
            "last_critique": last_critique,
        }

    def sign_off_mission(
        self,
        manager_id: str = "worker-system-manager",
        summary: str = "Mission verified and signed off against user requirements.",
    ) -> WorkerMessage:
        """Step 5: Manager reviews completed milestone against mission goals and issues sign-off."""
        self.blackboard.current_stage = "completed"
        msg = self.blackboard.post_message(
            sender_worker_id=manager_id,
            sender_role="manager",
            message_type=MessageType.MANAGER_SIGN_OFF,
            content=summary,
        )
        return msg


__all__ = [
    "DeliberationEngine",
    "MessageType",
    "MissionBlackboard",
    "WorkerMessage",
]
