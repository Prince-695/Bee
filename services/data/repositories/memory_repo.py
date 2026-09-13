"""Memory & Context Graph Repository for Bee Platform.

Supports both PostgreSQL (pgvector) and SQLite with dual-mode queries.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from services.data.repository import BaseRepository
from services.memory.models import (
    Citation,
    EpisodicRemediation,
    LinkRelation,
    MemoryLink,
    MemoryRecord,
    MemoryScope,
    MemoryType,
    _utc_now_iso,
)


class MemoryRepository(BaseRepository):
    """Data access repository for 3-Tier Memories, Context Graph Links, and Remediations."""

    # ─── Memory Records (Episodic, Semantic, Working) ───

    async def create_memory(self, memory: MemoryRecord) -> MemoryRecord:
        """Persists a new memory record into the database."""
        tags_json = json.dumps(memory.tags)
        meta_dict = dict(memory.metadata)
        if memory.citations:
            meta_dict["citations"] = [c.model_dump() for c in memory.citations]
        metadata_json = json.dumps(meta_dict)
        embedding_val = memory.embedding or []

        if self.db.is_postgres:
            emb_str = str(embedding_val) if embedding_val else None
            await self.db.execute(
                """
                INSERT INTO memories (
                    id, tenant_id, user_id, project_id, worker_id,
                    type, scope, title, content, tags_json, metadata_json,
                    confidence, embedding, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    memory.id, memory.tenant_id, memory.user_id, memory.project_id, memory.worker_id,
                    memory.type.value, memory.scope.value, memory.title, memory.content, tags_json, metadata_json,
                    memory.confidence, emb_str, memory.created_at, memory.updated_at,
                ),
            )
        else:
            await self.db.execute(
                """
                INSERT INTO memories (
                    id, tenant_id, user_id, project_id, worker_id,
                    type, scope, title, content, tags_json, metadata_json,
                    confidence, embedding_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    memory.id, memory.tenant_id, memory.user_id, memory.project_id, memory.worker_id,
                    memory.type.value, memory.scope.value, memory.title, memory.content, tags_json, metadata_json,
                    memory.confidence, json.dumps(embedding_val), memory.created_at, memory.updated_at,
                ),
            )
        return memory

    async def get_memory(self, memory_id: str, tenant_id: str) -> Optional[MemoryRecord]:
        """Retrieves a single memory record by ID and tenant."""
        row = await self.db.fetch_one(
            "SELECT * FROM memories WHERE id = ? AND tenant_id = ?",
            (memory_id, tenant_id),
        )
        if not row:
            return None
        return self._row_to_memory(row)

    async def update_memory(
        self,
        memory_id: str,
        tenant_id: str,
        updates: Dict[str, Any],
    ) -> Optional[MemoryRecord]:
        """Updates an existing memory item."""
        existing = await self.get_memory(memory_id, tenant_id)
        if not existing:
            return None

        title = updates.get("title", existing.title)
        content = updates.get("content", existing.content)
        confidence = updates.get("confidence", existing.confidence)
        tags = updates.get("tags", existing.tags)
        metadata = updates.get("metadata", existing.metadata)
        updated_at = _utc_now_iso()

        tags_json = json.dumps(tags)
        metadata_json = json.dumps(metadata)

        await self.db.execute(
            """
            UPDATE memories
            SET title = ?, content = ?, confidence = ?, tags_json = ?, metadata_json = ?, updated_at = ?
            WHERE id = ? AND tenant_id = ?
            """,
            (title, content, confidence, tags_json, metadata_json, updated_at, memory_id, tenant_id),
        )
        return await self.get_memory(memory_id, tenant_id)

    async def delete_memory(self, memory_id: str, tenant_id: str) -> bool:
        """Purges a memory item and cascades deletion of context graph edges (Forget guarantee)."""
        # Delete context graph links referencing this memory
        await self.db.execute(
            "DELETE FROM memory_links WHERE (source_id = ? OR target_id = ?) AND tenant_id = ?",
            (memory_id, memory_id, tenant_id),
        )
        # Delete the memory itself
        row = await self.db.fetch_one(
            "SELECT id FROM memories WHERE id = ? AND tenant_id = ?",
            (memory_id, tenant_id),
        )
        if not row:
            return False
        await self.db.execute(
            "DELETE FROM memories WHERE id = ? AND tenant_id = ?",
            (memory_id, tenant_id),
        )
        return True

    async def list_memories(
        self,
        tenant_id: str,
        scope: Optional[str] = None,
        memory_type: Optional[str] = None,
        project_id: Optional[str] = None,
        worker_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[MemoryRecord]:
        """Lists memories matching optional filters."""
        query = "SELECT * FROM memories WHERE tenant_id = ?"
        params: List[Any] = [tenant_id]

        if scope:
            query += " AND scope = ?"
            params.append(scope)
        if memory_type:
            query += " AND type = ?"
            params.append(memory_type)
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if worker_id:
            query += " AND worker_id = ?"
            params.append(worker_id)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = await self.db.fetch_all(query, tuple(params))
        return [self._row_to_memory(r) for r in rows]

    # ─── Context Graph Links (Edges) ───

    async def create_link(self, link: MemoryLink) -> MemoryLink:
        """Adds a directed relationship edge to the Context Graph."""
        meta_json = json.dumps(link.metadata)
        await self.db.execute(
            """
            INSERT INTO memory_links (
                id, tenant_id, source_id, source_type, target_id, target_type,
                relation, weight, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                link.id, link.tenant_id, link.source_id, link.source_type, link.target_id, link.target_type,
                link.relation.value, link.weight, meta_json, link.created_at,
            ),
        )
        return link

    async def delete_link(self, link_id: str, tenant_id: str) -> bool:
        """Removes a relationship edge from the Context Graph."""
        row = await self.db.fetch_one(
            "SELECT id FROM memory_links WHERE id = ? AND tenant_id = ?",
            (link_id, tenant_id),
        )
        if not row:
            return False
        await self.db.execute(
            "DELETE FROM memory_links WHERE id = ? AND tenant_id = ?",
            (link_id, tenant_id),
        )
        return True

    async def get_links_for_node(
        self,
        node_id: str,
        tenant_id: str,
        direction: str = "both",
    ) -> List[MemoryLink]:
        """Gets inbound, outbound, or bidirectional edges for a node."""
        if direction == "out":
            query = "SELECT * FROM memory_links WHERE source_id = ? AND tenant_id = ?"
            params = (node_id, tenant_id)
        elif direction == "in":
            query = "SELECT * FROM memory_links WHERE target_id = ? AND tenant_id = ?"
            params = (node_id, tenant_id)
        else:
            query = "SELECT * FROM memory_links WHERE (source_id = ? OR target_id = ?) AND tenant_id = ?"
            params = (node_id, node_id, tenant_id)

        rows = await self.db.fetch_all(query, params)
        return [self._row_to_link(r) for r in rows]

    # ─── Episodic Remediations (Self-Healing Catalog) ───

    async def save_remediation(self, remediation: EpisodicRemediation) -> EpisodicRemediation:
        """Stores a verified remediation into the self-healing catalog."""
        tags_json = json.dumps(remediation.tags)
        emb_val = remediation.embedding or []

        if self.db.is_postgres:
            emb_str = str(emb_val) if emb_val else None
            await self.db.execute(
                """
                INSERT INTO remediations (
                    id, tenant_id, problem_signature, error_log, patch_diff,
                    verified_by_worker_id, success_count, tags_json, embedding,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    remediation.id, remediation.tenant_id, remediation.problem_signature,
                    remediation.error_log, remediation.patch_diff, remediation.verified_by_worker_id,
                    remediation.success_count, tags_json, emb_str, remediation.created_at, remediation.updated_at,
                ),
            )
        else:
            await self.db.execute(
                """
                INSERT INTO remediations (
                    id, tenant_id, problem_signature, error_log, patch_diff,
                    verified_by_worker_id, success_count, tags_json, embedding_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    remediation.id, remediation.tenant_id, remediation.problem_signature,
                    remediation.error_log, remediation.patch_diff, remediation.verified_by_worker_id,
                    remediation.success_count, tags_json, json.dumps(emb_val), remediation.created_at, remediation.updated_at,
                ),
            )
        return remediation

    async def get_remediation(self, remediation_id: str, tenant_id: str) -> Optional[EpisodicRemediation]:
        """Gets a remediation by ID."""
        row = await self.db.fetch_one(
            "SELECT * FROM remediations WHERE id = ? AND tenant_id = ?",
            (remediation_id, tenant_id),
        )
        if not row:
            return None
        return self._row_to_remediation(row)

    async def list_remediations(self, tenant_id: str, limit: int = 50) -> List[EpisodicRemediation]:
        """Lists all remediations for a tenant ordered by success count."""
        rows = await self.db.fetch_all(
            "SELECT * FROM remediations WHERE tenant_id = ? ORDER BY success_count DESC, updated_at DESC LIMIT ?",
            (tenant_id, limit),
        )
        return [self._row_to_remediation(r) for r in rows]

    async def increment_remediation_success(self, remediation_id: str, tenant_id: str) -> bool:
        """Increments success counter when a past patch works again."""
        now = _utc_now_iso()
        await self.db.execute(
            "UPDATE remediations SET success_count = success_count + 1, updated_at = ? WHERE id = ? AND tenant_id = ?",
            (now, remediation_id, tenant_id),
        )
        return True

    # ─── Row Mappers ───

    def _row_to_memory(self, row: Dict[str, Any]) -> MemoryRecord:
        tags = []
        if row.get("tags_json"):
            try:
                tags = json.loads(row["tags_json"])
            except Exception:
                tags = []

        meta = {}
        if row.get("metadata_json"):
            try:
                meta = json.loads(row["metadata_json"])
            except Exception:
                meta = {}

        citations = []
        if "citations" in meta and isinstance(meta["citations"], list):
            citations = [Citation(**c) for c in meta["citations"]]

        embedding = []
        raw_emb = row.get("embedding_json") or row.get("embedding")
        if raw_emb:
            try:
                embedding = json.loads(raw_emb) if isinstance(raw_emb, str) and raw_emb.startswith("[") else []
            except Exception:
                embedding = []

        return MemoryRecord(
            id=row["id"],
            tenant_id=row.get("tenant_id", "default"),
            user_id=row.get("user_id"),
            project_id=row.get("project_id"),
            worker_id=row.get("worker_id"),
            type=MemoryType(row.get("type", "semantic")),
            scope=MemoryScope(row.get("scope", "project")),
            title=row.get("title", ""),
            content=row.get("content", ""),
            tags=tags,
            metadata=meta,
            confidence=float(row.get("confidence", 1.0)),
            embedding=embedding or None,
            citations=citations,
            created_at=str(row.get("created_at", "")),
            updated_at=str(row.get("updated_at", "")),
        )

    def _row_to_link(self, row: Dict[str, Any]) -> MemoryLink:
        meta = {}
        if row.get("metadata_json"):
            try:
                meta = json.loads(row["metadata_json"])
            except Exception:
                meta = {}

        return MemoryLink(
            id=row["id"],
            tenant_id=row.get("tenant_id", "default"),
            source_id=row["source_id"],
            source_type=row["source_type"],
            target_id=row["target_id"],
            target_type=row["target_type"],
            relation=LinkRelation(row.get("relation", "PRODUCED")),
            weight=float(row.get("weight", 1.0)),
            metadata=meta,
            created_at=str(row.get("created_at", "")),
        )

    def _row_to_remediation(self, row: Dict[str, Any]) -> EpisodicRemediation:
        tags = []
        if row.get("tags_json"):
            try:
                tags = json.loads(row["tags_json"])
            except Exception:
                tags = []

        embedding = []
        raw_emb = row.get("embedding_json") or row.get("embedding")
        if raw_emb:
            try:
                embedding = json.loads(raw_emb) if isinstance(raw_emb, str) and raw_emb.startswith("[") else []
            except Exception:
                embedding = []

        return EpisodicRemediation(
            id=row["id"],
            tenant_id=row.get("tenant_id", "default"),
            problem_signature=row["problem_signature"],
            error_log=row.get("error_log"),
            patch_diff=row.get("patch_diff", ""),
            verified_by_worker_id=row.get("verified_by_worker_id"),
            success_count=int(row.get("success_count", 1)),
            tags=tags,
            embedding=embedding or None,
            created_at=str(row.get("created_at", "")),
            updated_at=str(row.get("updated_at", "")),
        )
