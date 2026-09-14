"""Unit & Integration Tests for Phase 4: Durable Runs and Steps Persistence."""

from __future__ import annotations

import pytest
from services.data.database import DatabaseEngine
from services.data.repositories.mission_repo import MissionRepository


@pytest.fixture
def temp_mission_db(tmp_path):
    db_file = str(tmp_path / "test_mission.db")
    db = DatabaseEngine(database_url=None, sqlite_path=db_file)
    return db


@pytest.mark.anyio
async def test_mission_repo_runs_and_steps(temp_mission_db):
    """Test saving runs, querying runs, updating status, and persisting topological steps."""
    await temp_mission_db.init_db()
    repo = MissionRepository(db=temp_mission_db)

    # 1. Save Run
    run = await repo.save_run(
        run_id="run-001",
        title="Phase 4 Visual DAG Run",
        objective="Implement topological visual graph canvas",
        tenant_id="default",
        project_id="bee-core",
        crew_template_id="coding_flight",
        status="running",
        current_stage="scout",
    )
    assert run["id"] == "run-001"
    assert run["title"] == "Phase 4 Visual DAG Run"

    # 2. Query Run
    fetched = await repo.get_run("run-001")
    assert fetched is not None
    assert fetched["status"] == "running"
    assert fetched["crew_template_id"] == "coding_flight"

    # 3. List Runs
    runs = await repo.list_runs(tenant_id="default", project_id="bee-core")
    assert len(runs) == 1
    assert runs[0]["id"] == "run-001"

    # 4. Save Steps
    step1 = await repo.save_run_step(
        step_id="step-01",
        run_id="run-001",
        node_id="scout",
        worker_role="scout",
        status="running",
    )
    assert step1["node_id"] == "scout"

    # 5. Append stdout and update step status
    await repo.append_step_stdout("run-001", "scout", "Analyzing AST symbols...\n")
    await repo.update_step_status("run-001", "scout", status="completed", duration_ms=1200)

    # 6. Verify steps
    steps = await repo.get_run_steps("run-001")
    assert len(steps) == 1
    assert steps[0]["status"] == "completed"
    assert "Analyzing AST symbols" in steps[0]["stdout_log"]
    assert steps[0]["duration_ms"] == 1200

    # 7. Update run status
    await repo.update_run_status("run-001", status="completed", current_stage="completed")
    updated_run = await repo.get_run("run-001")
    assert updated_run["status"] == "completed"
    assert updated_run["current_stage"] == "completed"
