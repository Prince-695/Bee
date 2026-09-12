"""Specialized Worker Roles and Prompt Compiler for Multi-Agent Missions."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class WorkerRole(str, Enum):
    INSPECTOR = "inspector"
    TESTER = "tester"
    FIXER = "fixer"
    GUARD = "guard"
    SCRIBE = "scribe"


class WorkerProfile(BaseModel):
    role: WorkerRole
    name: str
    description: str
    allowed_tools: List[str]
    system_prompt: str


WORKER_PROFILES: Dict[WorkerRole, WorkerProfile] = {
    WorkerRole.INSPECTOR: WorkerProfile(
        role=WorkerRole.INSPECTOR,
        name="Scout & Inspector Worker",
        description="Analyzes codebases, diffs, AST symbols, and dependencies without modifying files.",
        allowed_tools=["code_ripgrep", "code_find_files", "code_view_file", "git_status", "git_diff", "git_log"],
        system_prompt=(
            "You are the Bee Scout & Inspector Worker. Your mission is to deeply understand the codebase, "
            "trace dependencies, inspect modified git diffs, and pinpoint anomalies or structural issues. "
            "You only perform read-only operations and output structured findings."
        ),
    ),
    WorkerRole.TESTER: WorkerProfile(
        role=WorkerRole.TESTER,
        name="Edge-Case & Regression Tester",
        description="Synthesizes edge-case inputs, runs unit/integration tests, and proves correctness.",
        allowed_tools=["run_command", "run_test_suite", "code_view_file", "code_find_files"],
        system_prompt=(
            "You are the Bee Edge-Case Tester Worker. Your mission is to write and execute rigorous unit tests, "
            "explore edge-case failure modes, test boundary conditions, and verify regression stability in the sandbox."
        ),
    ),
    WorkerRole.FIXER: WorkerProfile(
        role=WorkerRole.FIXER,
        name="Remediation & Auto-Heal Fixer",
        description="Writes precise code repairs, refactors broken modules, and iterates until tests pass.",
        allowed_tools=["write_file", "read_file", "run_test_suite", "run_command", "run_linter", "git_status", "git_diff"],
        system_prompt=(
            "You are the Bee Remediation & Auto-Heal Fixer Worker. Your mission is to repair failing code, "
            "fix syntax and logic errors, and re-run sandbox tests until verification passes with 0 errors."
        ),
    ),
    WorkerRole.GUARD: WorkerProfile(
        role=WorkerRole.GUARD,
        name="Security & Policy Guard",
        description="Evaluates critical operations, secret leaks, breaking changes, and approval gate policies.",
        allowed_tools=["git_status", "git_diff", "code_view_file"],
        system_prompt=(
            "You are the Bee Security & Policy Guard. Your mission is to audit planned actions for risk, "
            "detect destructive operations or credential leaks, and enforce zero-trust human authorization gates."
        ),
    ),
    WorkerRole.SCRIBE: WorkerProfile(
        role=WorkerRole.SCRIBE,
        name="Documentation & Scribe Worker",
        description="Generates PR descriptions, evidence-based changelogs, architecture notes, and summaries.",
        allowed_tools=["git_log", "git_diff", "code_view_file"],
        system_prompt=(
            "You are the Bee Scribe Worker. Your mission is to produce comprehensive, crystal-clear documentation, "
            "format markdown pull request summaries, record verification evidence, and generate changelog entries."
        ),
    ),
}


def get_worker_profile(role: WorkerRole | str) -> WorkerProfile:
    role_enum = WorkerRole(role) if isinstance(role, str) else role
    return WORKER_PROFILES[role_enum]
