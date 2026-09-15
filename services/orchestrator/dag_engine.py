"""Dynamic Directed Acyclic Graph (DAG) Task Engine for Bee Multi-Worker Orchestration."""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    WAITING_GATE = "waiting_gate"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"


class DAGNode(BaseModel):
    """Represents a single executable task node in the mission DAG."""
    id: str
    title: str
    assigned_role: str = "worker"
    assigned_worker_id: Optional[str] = None
    instruction: str
    dependencies: List[str] = Field(default_factory=list)
    status: TaskStatus = TaskStatus.PENDING
    input_artifacts: List[str] = Field(default_factory=list)
    output_artifacts: List[str] = Field(default_factory=list)
    result_summary: str = ""
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 2
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    gate_required: bool = False
    gate_risk_level: Optional[str] = None
    gate_id: Optional[str] = None
    stdout_log: str = ""
    duration_seconds: float = 0.0


class DAGGraph(BaseModel):
    """Directed Acyclic Graph managing multi-worker mission workflow."""
    mission_id: str
    nodes: Dict[str, DAGNode] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_utc_now_iso)
    updated_at: str = Field(default_factory=_utc_now_iso)

    def add_node(self, node: DAGNode) -> None:
        """Adds a new node to the graph and validates acyclicity."""
        if node.id in self.nodes:
            raise ValueError(f"Duplicate node ID '{node.id}' in DAG.")

        self.nodes[node.id] = node
        self.validate_dag()
        self.updated_at = _utc_now_iso()

    def add_dependency(self, target_node_id: str, depends_on_id: str) -> None:
        """Sets target_node_id to depend on depends_on_id."""
        if target_node_id not in self.nodes:
            raise KeyError(f"Node '{target_node_id}' does not exist.")
        if depends_on_id not in self.nodes:
            raise KeyError(f"Dependency node '{depends_on_id}' does not exist.")
        if target_node_id == depends_on_id:
            raise ValueError(f"Self-dependency is not allowed on node '{target_node_id}'.")

        node = self.nodes[target_node_id]
        if depends_on_id not in node.dependencies:
            node.dependencies.append(depends_on_id)
            self.validate_dag()
            self.updated_at = _utc_now_iso()

    def validate_dag(self) -> bool:
        """Validates that the graph is a valid DAG without cycles using Kahn's algorithm."""
        in_degree: Dict[str, int] = {nid: 0 for nid in self.nodes}
        adj: Dict[str, List[str]] = {nid: [] for nid in self.nodes}

        for nid, node in self.nodes.items():
            for dep in node.dependencies:
                if dep in self.nodes:
                    adj[dep].append(nid)
                    in_degree[nid] += 1

        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        visited_count = 0

        while queue:
            curr = queue.popleft()
            visited_count += 1
            for neighbor in adj[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited_count != len(self.nodes):
            raise ValueError(f"Cycle detected in mission DAG '{self.mission_id}'. Graph must be strictly acyclic.")

        return True

    def topological_sort(self) -> List[DAGNode]:
        """Returns nodes in topological execution order."""
        self.validate_dag()

        in_degree: Dict[str, int] = {nid: 0 for nid in self.nodes}
        adj: Dict[str, List[str]] = {nid: [] for nid in self.nodes}

        for nid, node in self.nodes.items():
            for dep in node.dependencies:
                if dep in self.nodes:
                    adj[dep].append(nid)
                    in_degree[nid] += 1

        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        ordered: List[DAGNode] = []

        while queue:
            curr = queue.popleft()
            ordered.append(self.nodes[curr])
            for neighbor in adj[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return ordered

    def get_topological_tiers(self) -> List[List[str]]:
        """Calculates execution tiers (depths) for multi-column visual graph layouts."""
        self.validate_dag()
        tiers: Dict[str, int] = {}

        # Roots have depth 0
        ordered = self.topological_sort()
        for node in ordered:
            if not node.dependencies:
                tiers[node.id] = 0
            else:
                max_parent_tier = max(tiers.get(dep, 0) for dep in node.dependencies if dep in tiers)
                tiers[node.id] = max_parent_tier + 1

        max_tier = max(tiers.values()) if tiers else 0
        grouped: List[List[str]] = [[] for _ in range(max_tier + 1)]
        for nid, tier in tiers.items():
            grouped[tier].append(nid)
        return grouped

    def get_ready_nodes(self) -> List[DAGNode]:
        """Discovers all PENDING nodes whose prerequisite dependencies are COMPLETED."""
        ready: List[DAGNode] = []
        for node in self.nodes.values():
            if node.status != TaskStatus.PENDING:
                continue

            deps_satisfied = True
            for dep_id in node.dependencies:
                dep_node = self.nodes.get(dep_id)
                if not dep_node or dep_node.status != TaskStatus.COMPLETED:
                    deps_satisfied = False
                    break

            if deps_satisfied:
                ready.append(node)

        return ready

    def mark_node_running(self, node_id: str, worker_id: Optional[str] = None) -> DAGNode:
        node = self._get_node(node_id)
        node.status = TaskStatus.RUNNING
        node.started_at = _utc_now_iso()
        if worker_id:
            node.assigned_worker_id = worker_id
        self.updated_at = _utc_now_iso()
        return node

    def mark_node_waiting_gate(self, node_id: str, gate_id: str) -> DAGNode:
        """Transitions a node to WAITING_GATE, pausing downstream execution."""
        node = self._get_node(node_id)
        node.status = TaskStatus.WAITING_GATE
        node.gate_id = gate_id
        self.updated_at = _utc_now_iso()
        return node

    def resolve_gate(self, node_id: str, action: str) -> DAGNode:
        """Applies human gate decision: 'approved' transitions to running, 'rejected' fails node."""
        node = self._get_node(node_id)
        if node.status != TaskStatus.WAITING_GATE:
            return node

        if action.lower() == "approved":
            node.status = TaskStatus.RUNNING
        else:
            node.status = TaskStatus.FAILED
            node.error = f"Rejected by human gate approval ({node.gate_id})"
            node.completed_at = _utc_now_iso()
            self._cascade_blocked(node_id)

        self.updated_at = _utc_now_iso()
        return node

    def append_node_stdout(self, node_id: str, chunk: str) -> None:
        """Appends streaming log chunk to the node's stdout buffer."""
        node = self._get_node(node_id)
        node.stdout_log += chunk
        self.updated_at = _utc_now_iso()

    def mark_node_completed(
        self,
        node_id: str,
        result_summary: str = "",
        output_artifacts: Optional[List[str]] = None,
        duration_seconds: float = 0.0,
    ) -> DAGNode:
        node = self._get_node(node_id)
        node.status = TaskStatus.COMPLETED
        node.completed_at = _utc_now_iso()
        node.result_summary = result_summary
        node.duration_seconds = duration_seconds
        if output_artifacts:
            node.output_artifacts.extend(output_artifacts)
        self.updated_at = _utc_now_iso()
        return node

    def mark_node_failed(self, node_id: str, error: str) -> DAGNode:
        node = self._get_node(node_id)
        node.error = error
        node.retry_count += 1

        if node.retry_count <= node.max_retries:
            # Allow automatic retry
            node.status = TaskStatus.PENDING
        else:
            node.status = TaskStatus.FAILED
            node.completed_at = _utc_now_iso()
            self._cascade_blocked(node_id)

        self.updated_at = _utc_now_iso()
        return node

    def _cascade_blocked(self, failed_node_id: str) -> None:
        """Cascades BLOCKED status to all downstream dependent nodes."""
        queue = deque([failed_node_id])
        while queue:
            curr_id = queue.popleft()
            for node in self.nodes.values():
                if curr_id in node.dependencies and node.status in (TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.WAITING_GATE):
                    node.status = TaskStatus.BLOCKED
                    node.error = f"Blocked by failure of upstream dependency '{curr_id}'"
                    queue.append(node.id)

    def is_finished(self) -> bool:
        """Returns True if every node is in a terminal state."""
        terminal = {TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.BLOCKED, TaskStatus.SKIPPED}
        return all(n.status in terminal for n in self.nodes.values())

    def has_waiting_gates(self) -> bool:
        """Returns True if any node is currently waiting for human gate approval."""
        return any(n.status == TaskStatus.WAITING_GATE for n in self.nodes.values())

    def progress_percent(self) -> float:
        """Calculates current completion percentage (0.0 to 100.0)."""
        if not self.nodes:
            return 0.0
        completed = sum(1 for n in self.nodes.values() if n.status == TaskStatus.COMPLETED)
        return round((completed / len(self.nodes)) * 100.0, 1)

    def _get_node(self, node_id: str) -> DAGNode:
        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' not found in DAG.")
        return self.nodes[node_id]


__all__ = ["DAGGraph", "DAGNode", "TaskStatus"]
