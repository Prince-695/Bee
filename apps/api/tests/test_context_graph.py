"""Tests for ContextGraph: edge linking, multi-hop BFS traversal, and project subgraph extraction."""

import pytest
from services.data.repositories.memory_repo import MemoryRepository
from services.memory.context_graph import ContextGraph
from services.memory.models import LinkRelation


@pytest.fixture
def mem_repo():
    from bee_core.db.connection import get_db_engine
    return MemoryRepository(db=get_db_engine())


@pytest.fixture
async def setup_db():
    from bee_core.db.connection import get_db_engine
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_context_graph_linking_and_traversal(mem_repo: MemoryRepository, setup_db):
    """Verify linking entities and traversing graph via multi-hop BFS."""
    graph = ContextGraph(memory_repo=mem_repo)
    tenant_id = "tenant-graph"

    # User -> Project
    await graph.link(
        tenant_id=tenant_id,
        source_id="user-alice",
        source_type="user",
        target_id="proj-web",
        target_type="project",
        relation=LinkRelation.BELONGS_TO,
    )

    # Project -> Worker
    await graph.link(
        tenant_id=tenant_id,
        source_id="proj-web",
        source_type="project",
        target_id="worker-dev",
        target_type="worker",
        relation=LinkRelation.EXECUTED,
    )

    # Worker -> Artifact
    await graph.link(
        tenant_id=tenant_id,
        source_id="worker-dev",
        source_type="worker",
        target_id="artifact-bundle",
        target_type="artifact",
        relation=LinkRelation.PRODUCED,
    )

    # Traverse 2 hops from User Alice
    subgraph_2_hop = await graph.traverse_subgraph("user-alice", tenant_id, max_depth=2)
    assert subgraph_2_hop["root"] == "user-alice"
    # depth 1: proj-web, depth 2: worker-dev
    assert "user-alice" in subgraph_2_hop["nodes"]
    assert "proj-web" in subgraph_2_hop["nodes"]
    assert "worker-dev" in subgraph_2_hop["nodes"]
    assert len(subgraph_2_hop["edges"]) == 2

    # Traverse 3 hops from User Alice
    subgraph_3_hop = await graph.traverse_subgraph("user-alice", tenant_id, max_depth=3)
    # depth 3: artifact-bundle
    assert "artifact-bundle" in subgraph_3_hop["nodes"]
    assert len(subgraph_3_hop["edges"]) == 3


@pytest.mark.anyio
async def test_project_context_subgraph(mem_repo: MemoryRepository, setup_db):
    """Verify extracting categorized entities connected to a project."""
    graph = ContextGraph(memory_repo=mem_repo)
    tenant_id = "tenant-proj-graph"
    proj_id = "proj-mobile"

    await graph.link(
        tenant_id=tenant_id,
        source_id=proj_id,
        source_type="project",
        target_id="worker-lead",
        target_type="worker",
        relation=LinkRelation.EXECUTED,
    )
    await graph.link(
        tenant_id=tenant_id,
        source_id=proj_id,
        source_type="project",
        target_id="task-oauth-login",
        target_type="task",
        relation=LinkRelation.DEPENDS_ON,
    )
    await graph.link(
        tenant_id=tenant_id,
        source_id="task-oauth-login",
        source_type="task",
        target_id="artifact-apk",
        target_type="artifact",
        relation=LinkRelation.PRODUCED,
    )

    proj_subgraph = await graph.get_project_context_subgraph(proj_id, tenant_id)
    assert proj_id == proj_subgraph["root"]
    entities = proj_subgraph["entities"]
    assert "worker-lead" in entities["workers"]
    assert "task-oauth-login" in entities["tasks"]
    assert "artifact-apk" in entities["artifacts"]
