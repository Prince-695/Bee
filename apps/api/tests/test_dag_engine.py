"""Tests for Dynamic DAG Task Engine, Crew Templates, and Mission Orchestrator."""

import pytest
from services.orchestrator.crew_templates import (
    CODING_FLIGHT_TEMPLATE,
    RESEARCH_SWARM_TEMPLATE,
    SECURITY_AUDIT_TEMPLATE,
    build_dag_from_template,
    get_crew_template,
    list_crew_templates,
)
from services.orchestrator.dag_engine import DAGGraph, DAGNode, TaskStatus
from services.orchestrator.mission_orchestrator import MissionOrchestrator
from bee_core.mission.mission_models import Mission, MissionStage


def test_crew_templates_registry():
    """Verify all 3 built-in crew templates are registered and valid."""
    templates = list_crew_templates()
    assert len(templates) == 3
    ids = [t.id for t in templates]
    assert "coding_flight" in ids
    assert "research_swarm" in ids
    assert "security_audit" in ids

    coding = get_crew_template("coding_flight")
    assert coding is not None
    assert len(coding.stages) == 5
    assert coding.stages[0].id == "scout"
    assert coding.stages[-1].requires_gate is True


def test_dag_engine_acyclic_and_topological_sort():
    """Verify cycle detection, acyclic validation, and topological sorting."""
    dag = DAGGraph(mission_id="test-mission-01")
    n1 = DAGNode(id="scout", title="Scout", instruction="Analyze AST")
    n2 = DAGNode(id="planner", title="Planner", instruction="Breakdown goal", dependencies=["scout"])
    n3 = DAGNode(id="builder", title="Builder", instruction="Generate patch", dependencies=["planner"])

    dag.add_node(n1)
    dag.add_node(n2)
    dag.add_node(n3)

    assert dag.validate_dag() is True
    ordered = dag.topological_sort()
    assert [n.id for n in ordered] == ["scout", "planner", "builder"]

    # Test cycle detection
    with pytest.raises(ValueError, match="Cycle detected"):
        dag.add_dependency("scout", "builder")


def test_dag_topological_tiers():
    """Verify calculation of topological tiers for visual canvas columns."""
    template = get_crew_template("research_swarm")
    assert template is not None
    dag = build_dag_from_template(template, mission_id="res-01", objective="Research Next.js 15")

    tiers = dag.get_topological_tiers()
    # Tier 0: scout
    assert "scout" in tiers[0]
    # Tier 1: searcher
    assert "searcher" in tiers[1]
    # Tier 2: synthesizer (depends on scout and searcher)
    assert "synthesizer" in tiers[2]
    # Tier 3: writer (depends on synthesizer)
    assert "writer" in tiers[3]


def test_dag_gate_pause_and_resolve():
    """Verify WAITING_GATE state transitions, resolution, and unblocking."""
    dag = DAGGraph(mission_id="gate-test-01")
    n1 = DAGNode(id="scan", title="Scan", instruction="Find vuln")
    n2 = DAGNode(
        id="patch",
        title="Patch",
        instruction="Fix vuln",
        dependencies=["scan"],
        gate_required=True,
    )
    dag.add_node(n1)
    dag.add_node(n2)

    dag.mark_node_completed("scan")
    ready = dag.get_ready_nodes()
    assert len(ready) == 1
    assert ready[0].id == "patch"

    # Mark waiting on gate
    dag.mark_node_waiting_gate("patch", gate_id="gate-12345")
    assert dag.has_waiting_gates() is True
    assert dag.nodes["patch"].status == TaskStatus.WAITING_GATE

    # Resolve gate approval
    dag.resolve_gate("patch", action="approved")
    assert dag.nodes["patch"].status == TaskStatus.RUNNING
    assert dag.has_waiting_gates() is False


@pytest.mark.anyio
async def test_mission_orchestrator_dynamic_stream(tmp_path):
    """Verify MissionOrchestrator executes dynamic DAG stream with event emission."""
    db_file = str(tmp_path / "test_bee.db")
    orchestrator = MissionOrchestrator(db_file)

    # Seed test mission in store
    mission = Mission(
        mission_id="dyn-msn-01",
        objective="Verify dynamic DAG runner execution",
    )
    orchestrator.store.create_mission(mission)

    events = []
    async for event in orchestrator.execute_mission_stream("dyn-msn-01", template_id="coding_flight"):
        events.append(event)

    event_types = [e["event"] for e in events]
    assert "mission_started" in event_types
    assert "node_started" in event_types
    assert "node_stdout" in event_types
    assert "gate_requested" in event_types
    assert "gate_resolved" in event_types
    assert "node_completed" in event_types
    assert "mission_completed" in event_types
