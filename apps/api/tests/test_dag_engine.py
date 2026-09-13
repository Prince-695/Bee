"""Unit tests for Dynamic DAG Task Engine, Topological Sorting, and Cycle Detection."""

import pytest
from services.orchestrator.dag_engine import DAGGraph, DAGNode, TaskStatus


def test_dag_creation_and_topological_sort():
    """Verify nodes are executed in strict prerequisite dependency order."""
    dag = DAGGraph(mission_id="mission-1")

    # Step 1: Research (no dependencies)
    dag.add_node(DAGNode(id="n1", title="Market Research", assigned_role="researcher", instruction="Find API specs"))
    # Step 2: Architecture (depends on Research)
    dag.add_node(DAGNode(id="n2", title="Design Architecture", assigned_role="coordinator", instruction="Draft plan", dependencies=["n1"]))
    # Step 3: Implement Backend (depends on Architecture)
    dag.add_node(DAGNode(id="n3", title="Backend API", assigned_role="developer", instruction="Code endpoints", dependencies=["n2"]))
    # Step 4: Implement Frontend (depends on Architecture in parallel with Backend)
    dag.add_node(DAGNode(id="n4", title="Frontend UI", assigned_role="developer", instruction="Build UI", dependencies=["n2"]))
    # Step 5: End-to-End Testing (depends on both Backend & Frontend)
    dag.add_node(DAGNode(id="n5", title="E2E Verification", assigned_role="reviewer", instruction="Run test suite", dependencies=["n3", "n4"]))

    ordered = dag.topological_sort()
    order_ids = [n.id for n in ordered]

    assert order_ids[0] == "n1"
    assert order_ids[1] == "n2"
    assert set(order_ids[2:4]) == {"n3", "n4"}
    assert order_ids[4] == "n5"


def test_cycle_detection():
    """Verify that circular dependencies are caught and rejected."""
    dag = DAGGraph(mission_id="mission-cycle")
    dag.add_node(DAGNode(id="a", title="Node A", instruction="Task A"))
    dag.add_node(DAGNode(id="b", title="Node B", instruction="Task B", dependencies=["a"]))
    dag.add_node(DAGNode(id="c", title="Node C", instruction="Task C", dependencies=["b"]))

    # Introducing cycle c -> a
    dag.nodes["a"].dependencies.append("c")

    with pytest.raises(ValueError) as exc_info:
        dag.validate_dag()
    assert "Cycle detected" in str(exc_info.value)


def test_parallel_ready_nodes_discovery():
    """Verify get_ready_nodes identifies multiple independent tasks for concurrent execution."""
    dag = DAGGraph(mission_id="mission-parallel")
    dag.add_node(DAGNode(id="init", title="Initialize Repo", instruction="Git init"))
    dag.add_node(DAGNode(id="task_a", title="Database Setup", instruction="Postgres setup", dependencies=["init"]))
    dag.add_node(DAGNode(id="task_b", title="Auth Setup", instruction="JWT setup", dependencies=["init"]))

    # Initially only 'init' is ready
    ready1 = dag.get_ready_nodes()
    assert len(ready1) == 1
    assert ready1[0].id == "init"

    # Complete 'init'
    dag.mark_node_completed("init", result_summary="Git repo initialized")

    # Now both 'task_a' and 'task_b' should be ready in parallel
    ready2 = dag.get_ready_nodes()
    assert len(ready2) == 2
    assert {n.id for n in ready2} == {"task_a", "task_b"}


def test_failure_retry_and_cascade_blocking():
    """Verify failing tasks retry up to max_retries and cascade BLOCKED status downstream upon exhaustion."""
    dag = DAGGraph(mission_id="mission-fail")
    dag.add_node(DAGNode(id="step1", title="Step 1", instruction="Do work", max_retries=1))
    dag.add_node(DAGNode(id="step2", title="Step 2", instruction="Dependent work", dependencies=["step1"]))

    # First failure -> should retry (status returns to PENDING)
    dag.mark_node_running("step1")
    dag.mark_node_failed("step1", error="Transient network timeout")
    assert dag.nodes["step1"].status == TaskStatus.PENDING
    assert dag.nodes["step1"].retry_count == 1

    # Second failure -> exceeds max_retries=1, marks FAILED and cascades BLOCKED to step2
    dag.mark_node_running("step1")
    dag.mark_node_failed("step1", error="Permanent auth error")
    assert dag.nodes["step1"].status == TaskStatus.FAILED
    assert dag.nodes["step2"].status == TaskStatus.BLOCKED
    assert "Blocked by failure of upstream dependency 'step1'" in dag.nodes["step2"].error
    assert dag.is_finished() is True


def test_progress_percent():
    """Verify progress percent computation."""
    dag = DAGGraph(mission_id="mission-prog")
    dag.add_node(DAGNode(id="n1", title="N1", instruction="1"))
    dag.add_node(DAGNode(id="n2", title="N2", instruction="2"))
    dag.add_node(DAGNode(id="n3", title="N3", instruction="3"))
    dag.add_node(DAGNode(id="n4", title="N4", instruction="4"))

    assert dag.progress_percent() == 0.0

    dag.mark_node_completed("n1")
    assert dag.progress_percent() == 25.0

    dag.mark_node_completed("n2")
    assert dag.progress_percent() == 50.0

    dag.mark_node_completed("n3")
    dag.mark_node_completed("n4")
    assert dag.progress_percent() == 100.0
