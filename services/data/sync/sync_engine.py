"""SyncEngine: Bidirectional Synchronization between Local SQLite and Cloud PostgreSQL."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import aiosqlite


class SyncEngine:
    def __init__(self, db_path: str = "./bee.db") -> None:
        self.db_path = db_path

    async def get_pending_sync_payload(self, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch all local offline entities that have not been synced or are pending."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row

            # 1. Fetch pending missions
            query_missions = """
                SELECT m.* FROM missions m
                LEFT JOIN sync_state s ON s.entity_type = 'mission' AND s.entity_id = m.mission_id
                WHERE (s.sync_status IS NULL OR s.sync_status = 'pending')
            """
            cursor = await db.execute(query_missions)
            mission_rows = await cursor.fetchall()
            missions = [dict(row) for row in mission_rows]

            # 2. Fetch pending approval gates
            query_approvals = """
                SELECT a.* FROM approval_gates a
                LEFT JOIN sync_state s ON s.entity_type = 'approval' AND s.entity_id = a.id
                WHERE (s.sync_status IS NULL OR s.sync_status = 'pending')
            """
            params_app: list[Any] = []
            if tenant_id:
                query_approvals += " AND a.tenant_id = ?"
                params_app.append(tenant_id)
            cursor = await db.execute(query_approvals, params_app)
            approval_rows = await cursor.fetchall()
            approvals = [dict(row) for row in approval_rows]

            return {
                "tenant_id": tenant_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "missions": missions,
                "approvals": approvals,
            }

    async def mark_entities_synced(self, entity_type: str, entity_ids: List[str]) -> None:
        """Mark list of entity IDs as synced in the local SQLite database."""
        if not entity_ids:
            return

        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            for eid in entity_ids:
                await db.execute(
                    """
                    INSERT INTO sync_state (entity_type, entity_id, sync_status, last_synced_at, updated_at)
                    VALUES (?, ?, 'synced', ?, ?)
                    ON CONFLICT(entity_type, entity_id) DO UPDATE SET
                        sync_status = 'synced',
                        last_synced_at = excluded.last_synced_at,
                        updated_at = excluded.updated_at
                    """,
                    (entity_type, eid, now, now),
                )
            await db.commit()

    async def apply_downstream_payload(self, payload: Dict[str, Any]) -> Dict[str, int]:
        """Apply incoming changes from cloud PostgreSQL into local SQLite (Downstream pull)."""
        counts = {"missions": 0, "approvals": 0}
        now = datetime.now(timezone.utc).isoformat()

        async with aiosqlite.connect(self.db_path) as db:
            # 1. Upsert Missions
            for m in payload.get("missions", []):
                mission_id = m.get("mission_id") or m.get("id")
                if not mission_id:
                    continue

                findings_raw = m.get("findings_json")
                if not isinstance(findings_raw, str):
                    findings_raw = json.dumps(findings_raw or [])

                artifacts_raw = m.get("artifacts_json")
                if not isinstance(artifacts_raw, str):
                    artifacts_raw = json.dumps(artifacts_raw or {})

                await db.execute(
                    """
                    INSERT INTO missions (
                        mission_id, signal_id, objective, status, stage, active_worker,
                        findings_json, artifacts_json, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(mission_id) DO UPDATE SET
                        objective = excluded.objective,
                        status = excluded.status,
                        stage = excluded.stage,
                        active_worker = excluded.active_worker,
                        findings_json = excluded.findings_json,
                        artifacts_json = excluded.artifacts_json,
                        updated_at = excluded.updated_at
                    """,
                    (
                        mission_id,
                        m.get("signal_id"),
                        m.get("objective") or m.get("title", "Mission"),
                        m.get("status", "created"),
                        m.get("stage", "scout"),
                        m.get("active_worker", "inspector"),
                        findings_raw,
                        artifacts_raw,
                        m.get("created_at", now),
                        m.get("updated_at", now),
                    ),
                )
                # Mark as synced
                await db.execute(
                    """
                    INSERT INTO sync_state (entity_type, entity_id, sync_status, last_synced_at)
                    VALUES ('mission', ?, 'synced', ?)
                    ON CONFLICT(entity_type, entity_id) DO UPDATE SET sync_status = 'synced', last_synced_at = ?
                    """,
                    (mission_id, now, now),
                )
                counts["missions"] += 1

            # 2. Upsert Approvals
            for a in payload.get("approvals", []):
                app_id = a.get("id")
                if not app_id:
                    continue
                payload_json = a.get("payload_json")
                if not isinstance(payload_json, str):
                    payload_json = json.dumps(payload_json or {})

                await db.execute(
                    """
                    INSERT INTO approval_gates (
                        id, tenant_id, mission_id, flight_id, action_type, payload_json, status, token_hash, created_at, resolved_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        status = excluded.status,
                        resolved_at = excluded.resolved_at
                    """,
                    (
                        app_id,
                        a.get("tenant_id", "default"),
                        a.get("mission_id"),
                        a.get("flight_id"),
                        a.get("action_type", "push"),
                        payload_json,
                        a.get("status", "pending"),
                        a.get("token_hash", "hash"),
                        a.get("created_at", now),
                        a.get("resolved_at"),
                    ),
                )
                counts["approvals"] += 1

            await db.commit()

        return counts
