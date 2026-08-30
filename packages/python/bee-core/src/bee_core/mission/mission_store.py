"""SQLite storage for Multi-Worker Missions and Findings."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from bee_core.mission.mission_models import Finding, Mission, MissionStage


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MissionStore:
    def __init__(self, db_path: str = "./bee.db") -> None:
        self.db_path = str(Path(db_path).resolve())
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS missions (
                    mission_id TEXT PRIMARY KEY,
                    signal_id TEXT,
                    objective TEXT NOT NULL,
                    status TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    active_worker TEXT NOT NULL,
                    findings_json TEXT NOT NULL,
                    artifacts_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def create_mission(self, mission: Mission) -> Dict[str, Any]:
        findings_str = json.dumps([f.model_dump() for f in mission.findings])
        artifacts_str = json.dumps(mission.artifacts)
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO missions (
                    mission_id, signal_id, objective, status, stage, active_worker, findings_json, artifacts_json, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mission.mission_id,
                    mission.signal_id,
                    mission.objective,
                    mission.status,
                    mission.stage.value,
                    mission.active_worker,
                    findings_str,
                    artifacts_str,
                    mission.created_at,
                    mission.updated_at,
                ),
            )
            conn.commit()
        return self.get_mission(mission.mission_id) or {}

    def get_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM missions WHERE mission_id = ?",
                (mission_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "mission_id": row["mission_id"],
                "signal_id": row["signal_id"],
                "objective": row["objective"],
                "status": row["status"],
                "stage": row["stage"],
                "active_worker": row["active_worker"],
                "findings": json.loads(row["findings_json"] or "[]"),
                "artifacts": json.loads(row["artifacts_json"] or "{}"),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }

    def update_mission_stage(
        self,
        mission_id: str,
        stage: MissionStage | str,
        active_worker: str,
        status: Optional[str] = None,
    ) -> bool:
        now = _utc_now_iso()
        stage_val = stage.value if isinstance(stage, MissionStage) else stage
        with self._get_connection() as conn:
            if status:
                cursor = conn.execute(
                    """
                    UPDATE missions
                    SET stage = ?, active_worker = ?, status = ?, updated_at = ?
                    WHERE mission_id = ?
                    """,
                    (stage_val, active_worker, status, now, mission_id),
                )
            else:
                cursor = conn.execute(
                    """
                    UPDATE missions
                    SET stage = ?, active_worker = ?, updated_at = ?
                    WHERE mission_id = ?
                    """,
                    (stage_val, active_worker, now, mission_id),
                )
            conn.commit()
            return cursor.rowcount > 0

    def add_finding(self, mission_id: str, finding: Finding) -> bool:
        mission_data = self.get_mission(mission_id)
        if not mission_data:
            return False
        findings = mission_data.get("findings", [])
        findings.append(finding.model_dump())
        now = _utc_now_iso()
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE missions
                SET findings_json = ?, updated_at = ?
                WHERE mission_id = ?
                """,
                (json.dumps(findings), now, mission_id),
            )
            conn.commit()
            return cursor.rowcount > 0

    def save_artifact(self, mission_id: str, key: str, artifact_data: Any) -> bool:
        mission_data = self.get_mission(mission_id)
        if not mission_data:
            return False
        artifacts = mission_data.get("artifacts", {})
        artifacts[key] = artifact_data
        now = _utc_now_iso()
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE missions
                SET artifacts_json = ?, updated_at = ?
                WHERE mission_id = ?
                """,
                (json.dumps(artifacts), now, mission_id),
            )
            conn.commit()
            return cursor.rowcount > 0

    def list_missions(self, limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM missions WHERE 1=1"
        params: List[Any] = []
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        with self._get_connection() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
            return [
                {
                    "mission_id": row["mission_id"],
                    "signal_id": row["signal_id"],
                    "objective": row["objective"],
                    "status": row["status"],
                    "stage": row["stage"],
                    "active_worker": row["active_worker"],
                    "findings": json.loads(row["findings_json"] or "[]"),
                    "artifacts": json.loads(row["artifacts_json"] or "{}"),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in rows
            ]
