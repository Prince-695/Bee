"""Runtime Repository for Bee Platform.

Dual-mode data access for paired desktop/CLI runtimes, heartbeats, and pairing token authentication.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from services.data.repository import BaseRepository


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_pairing_key(pairing_key: str) -> str:
    """Compute SHA-256 hash of a runtime pairing key."""
    return hashlib.sha256(pairing_key.strip().encode("utf-8")).hexdigest()


class RuntimeRepository(BaseRepository):
    """Unified repository managing paired local/CLI runtimes."""

    async def register_runtime(
        self,
        tenant_id: str,
        machine_name: str,
        os_name: str,
        capabilities: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Register a new workstation runtime, generate pairing token, and persist."""
        import uuid

        runtime_id = f"rt_{uuid.uuid4().hex[:12]}"
        plain_pairing_key = f"bee_rt_{uuid.uuid4().hex}"
        key_hash = hash_pairing_key(plain_pairing_key)
        caps = capabilities if capabilities is not None else ["filesystem", "terminal", "docker", "git"]
        caps_json = json.dumps(caps)
        meta_json = json.dumps(metadata or {})
        now = _utc_now_iso()

        await self.execute(
            """
            INSERT INTO paired_runtimes (
                id, tenant_id, machine_name, os_name, capabilities_json,
                pairing_key_hash, status, last_heartbeat_at, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                runtime_id,
                tenant_id,
                machine_name,
                os_name.lower(),
                caps_json,
                key_hash,
                "connected",
                now,
                meta_json,
                now,
            ),
        )

        return {
            "runtime_id": runtime_id,
            "tenant_id": tenant_id,
            "machine_name": machine_name,
            "os_name": os_name.lower(),
            "capabilities": caps,
            "pairing_key": plain_pairing_key,
            "status": "connected",
            "last_heartbeat_at": now,
            "metadata": metadata or {},
            "created_at": now,
        }

    async def record_heartbeat(self, runtime_id: str, status: str = "online") -> Optional[Dict[str, Any]]:
        """Update runtime last heartbeat timestamp and status."""
        now = _utc_now_iso()
        runtime = await self.fetch_one("SELECT * FROM paired_runtimes WHERE id = ?", (runtime_id,))
        if not runtime:
            return None

        await self.execute(
            "UPDATE paired_runtimes SET status = ?, last_heartbeat_at = ? WHERE id = ?",
            (status, now, runtime_id),
        )

        return {
            "runtime_id": runtime_id,
            "status": status,
            "last_heartbeat_at": now,
            "acknowledged": True,
        }

    async def list_runtimes(self, tenant_id: str, mark_stale_after_sec: int = 60) -> List[Dict[str, Any]]:
        """List all runtimes for tenant, auto-detecting stale heartbeats."""
        rows = await self.fetch_all(
            "SELECT * FROM paired_runtimes WHERE tenant_id = ? ORDER BY created_at DESC",
            (tenant_id,),
        )

        now_dt = datetime.now(timezone.utc)
        result = []

        for row in rows:
            r = dict(row)
            caps = json.loads(r.get("capabilities_json") or "[]")
            meta = json.loads(r.get("metadata_json") or "{}")
            last_hb_str = r.get("last_heartbeat_at")

            status = r.get("status", "online")
            if last_hb_str:
                try:
                    # Parse ISO string
                    hb_dt = datetime.fromisoformat(last_hb_str.replace("Z", "+00:00"))
                    if hb_dt.tzinfo is None:
                        hb_dt = hb_dt.replace(tzinfo=timezone.utc)
                    age_seconds = (now_dt - hb_dt).total_seconds()
                    if age_seconds > mark_stale_after_sec and status != "offline":
                        status = "offline"
                        # Asynchronously update stale status in background
                        await self.execute(
                            "UPDATE paired_runtimes SET status = 'offline' WHERE id = ?",
                            (r["id"],),
                        )
                except Exception:
                    pass

            result.append(
                {
                    "id": r["id"],
                    "runtime_id": r["id"],
                    "tenant_id": r["tenant_id"],
                    "machine_name": r["machine_name"],
                    "os_name": r["os_name"],
                    "capabilities": caps,
                    "status": status,
                    "last_heartbeat_at": str(last_hb_str or ""),
                    "metadata": meta,
                    "created_at": str(r.get("created_at") or ""),
                }
            )

        return result

    async def get_runtime(self, runtime_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve runtime details by id."""
        row = await self.fetch_one("SELECT * FROM paired_runtimes WHERE id = ?", (runtime_id,))
        if not row:
            return None
        r = dict(row)
        return {
            "id": r["id"],
            "runtime_id": r["id"],
            "tenant_id": r["tenant_id"],
            "machine_name": r["machine_name"],
            "os_name": r["os_name"],
            "capabilities": json.loads(r.get("capabilities_json") or "[]"),
            "status": r.get("status", "online"),
            "last_heartbeat_at": str(r.get("last_heartbeat_at") or ""),
            "metadata": json.loads(r.get("metadata_json") or "{}"),
            "created_at": str(r.get("created_at") or ""),
        }

    async def verify_pairing_key(self, plain_key: str) -> Optional[Dict[str, Any]]:
        """Authenticate a runtime via its pairing key."""
        key_hash = hash_pairing_key(plain_key)
        row = await self.fetch_one(
            "SELECT * FROM paired_runtimes WHERE pairing_key_hash = ?",
            (key_hash,),
        )
        if not row:
            return None
        return await self.get_runtime(row["id"])

    async def revoke_runtime(self, runtime_id: str, tenant_id: Optional[str] = None) -> bool:
        """Revoke pairing and delete runtime."""
        if tenant_id:
            existing = await self.fetch_one(
                "SELECT id FROM paired_runtimes WHERE id = ? AND tenant_id = ?",
                (runtime_id, tenant_id),
            )
        else:
            existing = await self.fetch_one("SELECT id FROM paired_runtimes WHERE id = ?", (runtime_id,))

        if not existing:
            return False

        await self.execute("DELETE FROM paired_runtimes WHERE id = ?", (runtime_id,))
        return True
