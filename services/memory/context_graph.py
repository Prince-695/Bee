"""Context Graph Engine: Entity-Relationship Knowledge Graph connecting Bee Ecosystem Entities."""

from __future__ import annotations

from collections import deque
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set

from services.memory.models import LinkRelation, MemoryLink

if TYPE_CHECKING:
    from services.data.repositories.memory_repo import MemoryRepository


class ContextGraph:
    """Directed Knowledge Graph connecting Users, Projects, Workers, Tasks, Artifacts, and Memories."""

    def __init__(self, memory_repo: Optional[Any] = None):
        if memory_repo is None:
            from services.data.repositories.memory_repo import MemoryRepository
            self.repo = MemoryRepository()
        else:
            self.repo = memory_repo

    async def link(
        self,
        tenant_id: str,
        source_id: str,
        source_type: str,
        target_id: str,
        target_type: str,
        relation: LinkRelation = LinkRelation.PRODUCED,
        weight: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> MemoryLink:
        """Creates or updates a directed edge between two entities in the Context Graph."""
        link = MemoryLink(
            tenant_id=tenant_id,
            source_id=source_id,
            source_type=source_type,
            target_id=target_id,
            target_type=target_type,
            relation=relation,
            weight=weight,
            metadata=metadata or {},
        )
        return await self.repo.create_link(link)

    async def unlink(self, link_id: str, tenant_id: str) -> bool:
        """Removes a relationship edge from the Context Graph."""
        return await self.repo.delete_link(link_id=link_id, tenant_id=tenant_id)

    async def get_neighbors(
        self,
        node_id: str,
        tenant_id: str,
        direction: str = "both",
    ) -> List[MemoryLink]:
        """Gets direct links connected to the given node."""
        return await self.repo.get_links_for_node(node_id=node_id, tenant_id=tenant_id, direction=direction)

    async def traverse_subgraph(
        self,
        start_node_id: str,
        tenant_id: str,
        max_depth: int = 2,
    ) -> Dict[str, Any]:
        """Performs Breadth-First Search (BFS) starting from node_id up to max_depth.
        
        Returns:
            Dict containing 'nodes' (unique node IDs encountered) and 'edges' (MemoryLinks).
        """
        visited_nodes: Set[str] = {start_node_id}
        collected_edges: List[MemoryLink] = []
        edge_ids: Set[str] = set()

        # Queue contains tuples of (node_id, current_depth)
        queue: deque[tuple[str, int]] = deque([(start_node_id, 0)])

        while queue:
            curr_node, depth = queue.popleft()
            if depth >= max_depth:
                continue

            neighbors = await self.get_neighbors(curr_node, tenant_id, direction="both")
            for edge in neighbors:
                if edge.id not in edge_ids:
                    edge_ids.add(edge.id)
                    collected_edges.append(edge)

                neighbor_node = edge.target_id if edge.source_id == curr_node else edge.source_id
                if neighbor_node not in visited_nodes:
                    visited_nodes.add(neighbor_node)
                    queue.append((neighbor_node, depth + 1))

        return {
            "root": start_node_id,
            "nodes": list(visited_nodes),
            "edges": [e.model_dump() for e in collected_edges],
            "total_nodes": len(visited_nodes),
            "total_edges": len(collected_edges),
        }

    async def get_project_context_subgraph(
        self,
        project_id: str,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """Extracts the contextual subgraph for a project (workers, tasks, artifacts, lessons)."""
        subgraph = await self.traverse_subgraph(project_id, tenant_id, max_depth=2)

        categorized: Dict[str, List[str]] = {
            "workers": [],
            "tasks": [],
            "artifacts": [],
            "memories": [],
            "other": [],
        }

        for edge_data in subgraph["edges"]:
            for id_field, type_field in [("source_id", "source_type"), ("target_id", "target_type")]:
                node_id = edge_data[id_field]
                node_type = edge_data[type_field]
                if node_id == project_id:
                    continue
                if node_type == "worker" and node_id not in categorized["workers"]:
                    categorized["workers"].append(node_id)
                elif node_type in ("task", "mission") and node_id not in categorized["tasks"]:
                    categorized["tasks"].append(node_id)
                elif node_type == "artifact" and node_id not in categorized["artifacts"]:
                    categorized["artifacts"].append(node_id)
                elif node_type == "memory" and node_id not in categorized["memories"]:
                    categorized["memories"].append(node_id)

        subgraph["entities"] = categorized
        return subgraph
