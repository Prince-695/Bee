"""Mission & Flight Queue Repository for Bee Platform."""

from __future__ import annotations

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


class MissionRepository(BaseRepository):
    """Unified repository managing missions, worker findings, and flight queues."""

    def __init__(self, db: Optional[Any] = None) -> None:
        super().__init__(db)
        self._mission_store = MissionStore()

    def init_db(self) -> None:
        init_flight_queue_db()

    # Mission Store Delegation
    def create_mission(self, mission: Any) -> Dict[str, Any]:
        return self._mission_store.create_mission(mission)

    def get_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        return self._mission_store.get_mission(mission_id)

    def update_mission(self, mission_id: str, **fields: Any) -> Optional[Dict[str, Any]]:
        return self._mission_store.update_mission(mission_id, **fields)

    def list_missions(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._mission_store.list_missions(limit=limit)

    # Flight Queue Delegation
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
