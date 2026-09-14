"""Mission & Flight Queue Repository for Bee Platform.

Dual-mode data access for missions, topological runs, worker findings, and flight queues across PostgreSQL and SQLite.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bee_core.stores.flight_queue_store import (
    init_flight_queue_db,
    enqueue_deferred_flight,
    mark_flight_ready,
    claim_flight_by_id,
    claim_next_ready_flight,
    complete_flight_task,
    list_flight_tasks,
    get_flight_task,
)
from bee_core.mission.mission_store import MissionStore
from services.data.repository import BaseRepository


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MissionRepository(BaseRepository):
    """Unified repository managing missions, topological runs, and flight queues."""

    def __init__(self, db: Optional[Any] = None) -> None:
        super().__init__(db)
        self._mission_store = MissionStore()

    def init_db(self) -> None:
        init_flight_queue_db()

    # ─── Durable Runs & Topological Steps (Dual Backend) ───

    async def save_run(
        self,
        run_id: str,
        title: str,
        objective: str,
        tenant_id: str = "default",
        project_id: Optional[str] = None,
        crew_template_id: Optional[str] = None,
        status: str = "created",
        current_stage: str = "scout",
        checkpoint_state: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Insert or update a multi-worker DAG run."""
        now = _utc_now_iso()
        check_json = json.dumps(checkpoint_state or {})
        await self.db.execute(
            """
            INSERT INTO runs (
                id, tenant_id, project_id, crew_template_id, title, objective,
                status, current_stage, findings_json, artifacts_json, checkpoint_state, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                tenant_id,
                project_id,
                crew_template_id,
                title,
                objective,
                status,
                current_stage,
                "[]",
                "{}",
                check_json,
                now,
                now,
            ),
        )
        return {
            "id": run_id,
            "tenant_id": tenant_id,
            "project_id": project_id,
            "crew_template_id": crew_template_id,
            "title": title,
            "objective": objective,
            "status": status,
            "current_stage": current_stage,
            "created_at": now,
            "updated_at": now,
        }

    async def get_run(self, run_id: str, tenant_id: str = "default") -> Optional[Dict[str, Any]]:
        """Fetch a run by ID."""
        row = await self.db.fetch_one(
            "SELECT * FROM runs WHERE id = ? AND tenant_id = ?",
            (run_id, tenant_id),
        )
        if not row:
            return None
        data = dict(row)
        for json_key in ("findings_json", "artifacts_json", "checkpoint_state"):
            if isinstance(data.get(json_key), str):
                try:
                    data[json_key] = json.loads(data[json_key])
                except Exception:
                    pass
        return data

    async def list_runs(
        self,
        tenant_id: str = "default",
        project_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """List runs with optional project or status filters."""
        query = "SELECT * FROM runs WHERE tenant_id = ?"
        params: List[Any] = [tenant_id]

        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = await self.db.fetch_all(query, tuple(params))
        return [dict(r) for r in rows]

    async def update_run_status(
        self,
        run_id: str,
        status: str,
        current_stage: Optional[str] = None,
        tenant_id: str = "default",
    ) -> bool:
        """Update a run's status and current stage."""
        now = _utc_now_iso()
        if current_stage:
            await self.db.execute(
                "UPDATE runs SET status = ?, current_stage = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
                (status, current_stage, now, run_id, tenant_id),
            )
        else:
            await self.db.execute(
                "UPDATE runs SET status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
                (status, now, run_id, tenant_id),
            )
        return True

    async def save_run_step(
        self,
        step_id: str,
        run_id: str,
        node_id: str,
        worker_role: str,
        status: str = "pending",
        gate_id: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        stdout_log: str = "",
        duration_ms: int = 0,
    ) -> Dict[str, Any]:
        """Persist or update a topological DAG step."""
        now = _utc_now_iso()
        in_json = json.dumps(input_data or {})
        out_json = json.dumps(output_data or {})
        await self.db.execute(
            """
            INSERT INTO run_steps (
                id, run_id, node_id, worker_role, status, gate_id,
                input_json, output_json, stdout_log, duration_ms, started_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                step_id,
                run_id,
                node_id,
                worker_role,
                status,
                gate_id,
                in_json,
                out_json,
                stdout_log,
                duration_ms,
                now,
            ),
        )
        return {
            "id": step_id,
            "run_id": run_id,
            "node_id": node_id,
            "worker_role": worker_role,
            "status": status,
            "gate_id": gate_id,
            "started_at": now,
        }

    async def get_run_steps(self, run_id: str) -> List[Dict[str, Any]]:
        """Fetch all steps in a DAG run."""
        rows = await self.db.fetch_all(
            "SELECT * FROM run_steps WHERE run_id = ? ORDER BY started_at ASC",
            (run_id,),
        )
        return [dict(r) for r in rows]

    async def update_step_status(
        self,
        run_id: str,
        node_id: str,
        status: str,
        output_data: Optional[Dict[str, Any]] = None,
        duration_ms: int = 0,
    ) -> bool:
        """Update step status and completion metadata."""
        now = _utc_now_iso()
        out_json = json.dumps(output_data or {})
        await self.db.execute(
            """
            UPDATE run_steps
            SET status = ?, output_json = ?, duration_ms = ?, completed_at = ?
            WHERE run_id = ? AND node_id = ?
            """,
            (status, out_json, duration_ms, now, run_id, node_id),
        )
        return True

    async def append_step_stdout(self, run_id: str, node_id: str, log_chunk: str) -> bool:
        """Append streaming stdout log to a run step."""
        await self.db.execute(
            "UPDATE run_steps SET stdout_log = stdout_log || ? WHERE run_id = ? AND node_id = ?",
            (log_chunk, run_id, node_id),
        )
        return True

    # ─── Mission Store Delegation (Legacy & Synchronous) ───

    def create_mission(self, mission: Any) -> Dict[str, Any]:
        return self._mission_store.create_mission(mission)

    def get_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        return self._mission_store.get_mission(mission_id)

    def update_mission(self, mission_id: str, **fields: Any) -> Optional[Dict[str, Any]]:
        return self._mission_store.update_mission(mission_id, **fields)

    def list_missions(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._mission_store.list_missions(limit=limit)

    # ─── Flight Queue Delegation ───

    def enqueue_flight(
        self,
        user_prompt: str,
        webhook_type: str,
        webhook_filter: Dict[str, Any],
        event_data: Optional[Dict[str, Any]] = None,
        route_id: Optional[str] = None,
    ) -> str:
        return enqueue_deferred_flight(
            user_prompt=user_prompt,
            webhook_type=webhook_type,
            webhook_filter=webhook_filter,
            event_data=event_data,
            route_id=route_id,
        )

    def mark_ready(self, task_id: str, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return mark_flight_ready(task_id=task_id, event_data=event_data)

    def claim_next_ready(self) -> Optional[Dict[str, Any]]:
        return claim_next_ready_flight()

    def claim_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        return claim_flight_by_id(task_id=task_id)

    def complete_task(self, task_id: str, status: str, result: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        return complete_flight_task(task_id=task_id, status=status, result=result)

    def list_tasks(self, limit: int = 100) -> List[Dict[str, Any]]:
        return list_flight_tasks(limit=limit)

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return get_flight_task(task_id=task_id)


__all__ = [
    "MissionRepository",
    "init_flight_queue_db",
    "enqueue_deferred_flight",
    "mark_flight_ready",
    "claim_flight_by_id",
    "claim_next_ready_flight",
    "complete_flight_task",
    "list_flight_tasks",
    "get_flight_task",
]
