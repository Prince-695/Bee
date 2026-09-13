"""Approval Gate Repository for Bee Platform."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from bee_core.stores.gate_store import (
    init_gate_db,
    create_gate,
    get_gate,
    list_gates,
    resolve_gate,
)
from services.data.repository import BaseRepository


class GateRepository(BaseRepository):
    """Repository handling human-in-the-loop approval gates."""

    def init_db(self) -> None:
        init_gate_db()

    def create_gate(
        self,
        route_id: str,
        step_num: int,
        server: str,
        tool: str,
        args: Dict[str, Any],
        action_summary: str,
    ) -> Dict[str, Any]:
        return create_gate(
            route_id=route_id,
            step_num=step_num,
            server=server,
            tool=tool,
            args=args,
            action_summary=action_summary,
        )

    def get_gate(self, gate_id: str) -> Optional[Dict[str, Any]]:
        return get_gate(gate_id=gate_id)

    def list_gates(self, route_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        return list_gates(route_id=route_id, status=status)

    def resolve_gate(self, gate_id: str, approved: Any) -> Optional[Dict[str, Any]]:
        status = approved if isinstance(approved, str) else ("approved" if approved else "rejected")
        return resolve_gate(gate_id=gate_id, status=status)


__all__ = [
    "GateRepository",
    "init_gate_db",
    "create_gate",
    "get_gate",
    "list_gates",
    "resolve_gate",
]
