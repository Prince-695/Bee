"""Declarative Crew Templates for Bee Multi-Worker DAG Orchestration."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from services.orchestrator.dag_engine import DAGGraph, DAGNode, TaskStatus


class CrewStage(BaseModel):
    """Represents a discrete stage/node in a Crew's execution DAG."""
    id: str
    title: str
    worker_role: str
    worker_name: str
    description: str
    dependencies: List[str] = Field(default_factory=list)
    allowed_tools: List[str] = Field(default_factory=list)
    requires_gate: bool = False
    gate_risk_level: Optional[str] = None  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"


class CrewTemplate(BaseModel):
    """Declarative specification of a coordinated multi-worker team."""
    id: str
    name: str
    tagline: str
    description: str
    category: str  # "engineering" | "research" | "security"
    icon: str      # Icon name for UI rendering ("Code2", "Search", "ShieldCheck")
    estimated_duration: str
    stages: List[CrewStage]


# ─── Built-in System Crew Templates ───────────────────────────────────────────

CODING_FLIGHT_TEMPLATE = CrewTemplate(
    id="coding_flight",
    name="Coding Flight Crew",
    tagline="Autonomous end-to-end feature patch and bug remediation crew",
    description=(
        "Coordinates Scout (AST mapping), Planner (DAG breakdown), Builder (code patch generation), "
        "Verifier (automated test execution), and Reviewer (zero-trust policy verification) to deliver "
        "verified code patches with 0 regression."
    ),
    category="engineering",
    icon="Code2",
    estimated_duration="30s - 2m",
    stages=[
        CrewStage(
            id="scout",
            title="Codebase & Dependency Mapping",
            worker_role="scout",
            worker_name="ScoutWorker",
            description="Analyzes repository AST symbols, changed files, and dependency graph.",
            dependencies=[],
            allowed_tools=["read_file", "ast_search", "find_symbols", "git_status"],
            requires_gate=False,
        ),
        CrewStage(
            id="planner",
            title="DAG Route & Strategy Formulation",
            worker_role="planner",
            worker_name="PlannerWorker",
            description="Formulates atomic patch strategy and defines verification acceptance criteria.",
            dependencies=["scout"],
            allowed_tools=["formulate_route", "decompose_goal"],
            requires_gate=False,
        ),
        CrewStage(
            id="builder",
            title="Patch Application & Code Synthesis",
            worker_role="builder",
            worker_name="BuilderWorker",
            description="Generates atomic code modifications and refactors target files.",
            dependencies=["planner"],
            allowed_tools=["write_file", "apply_patch", "read_file"],
            requires_gate=False,
        ),
        CrewStage(
            id="verifier",
            title="Regression & Test Suite QA",
            worker_role="verifier",
            worker_name="VerifierWorker",
            description="Executes test runner (pytest/vitest) and enforces test contract pass.",
            dependencies=["builder"],
            allowed_tools=["run_tests", "typecheck", "run_linter"],
            requires_gate=False,
        ),
        CrewStage(
            id="reviewer",
            title="Architecture & Gate Verification",
            worker_role="reviewer",
            worker_name="ReviewerWorker",
            description="Audits diff against zero-trust policies and requests developer gate authorization.",
            dependencies=["verifier"],
            allowed_tools=["audit_diff", "check_policies"],
            requires_gate=True,
            gate_risk_level="MEDIUM",
        ),
    ],
)

RESEARCH_SWARM_TEMPLATE = CrewTemplate(
    id="research_swarm",
    name="Research & Discovery Swarm",
    tagline="Parallel codebase exploration, web intelligence, and RFC drafting",
    description=(
        "Deploys parallel exploratory workers to research architectures, crawl reference documentation, "
        "and synthesize technical discovery RFCs with living citations."
    ),
    category="research",
    icon="Search",
    estimated_duration="20s - 1m",
    stages=[
        CrewStage(
            id="scout",
            title="Repository Context Discovery",
            worker_role="scout",
            worker_name="ScoutWorker",
            description="Inspects active codebase architecture, types, and existing conventions.",
            dependencies=[],
            allowed_tools=["read_file", "find_symbols", "ast_search"],
            requires_gate=False,
        ),
        CrewStage(
            id="searcher",
            title="External Intelligence & Web Search",
            worker_role="searcher",
            worker_name="SearchWorker",
            description="Retrieves public library documentation, GitHub issues, and API references in parallel.",
            dependencies=["scout"],
            allowed_tools=["web_search", "read_url_content"],
            requires_gate=False,
        ),
        CrewStage(
            id="synthesizer",
            title="Context Graph Citation & Synthesis",
            worker_role="synthesizer",
            worker_name="ContextSynthesizer",
            description="Cross-references internal codebase patterns with external search findings.",
            dependencies=["scout", "searcher"],
            allowed_tools=["recall_memory", "synthesize_graph"],
            requires_gate=False,
        ),
        CrewStage(
            id="writer",
            title="Technical Specification Drafting",
            worker_role="scribe",
            worker_name="DocumentationWorker",
            description="Generates polished markdown design documents and architecture summaries.",
            dependencies=["synthesizer"],
            allowed_tools=["write_file", "render_markdown"],
            requires_gate=False,
        ),
    ],
)

SECURITY_AUDIT_TEMPLATE = CrewTemplate(
    id="security_audit",
    name="Security Audit & Hardening Crew",
    tagline="Zero-trust AST taint analysis, credential leak prevention, and policy audit",
    description=(
        "Performs rigorous static security analysis, FileGuard constraint checks, and creates hardening "
        "patches governed by mandatory human approval gates."
    ),
    category="security",
    icon="ShieldCheck",
    estimated_duration="30s - 1.5m",
    stages=[
        CrewStage(
            id="inspector",
            title="Static Taint & Secret Scan",
            worker_role="scout",
            worker_name="SecurityInspector",
            description="Scans files for hardcoded credentials, secret leaks, and sensitive pattern access.",
            dependencies=[],
            allowed_tools=["read_file", "code_ripgrep", "git_log"],
            requires_gate=False,
        ),
        CrewStage(
            id="auditor",
            title="FileGuard & Policy Audit",
            worker_role="reviewer",
            worker_name="PolicyAuditor",
            description="Checks AST against zero-trust security rules and verifies no .env tampering.",
            dependencies=["inspector"],
            allowed_tools=["check_policies", "audit_diff"],
            requires_gate=False,
        ),
        CrewStage(
            id="hardening_builder",
            title="Hardening Patch Synthesis",
            worker_role="builder",
            worker_name="HardeningBuilder",
            description="Generates sanitized configurations and updates safe .env.example placeholders.",
            dependencies=["auditor"],
            allowed_tools=["write_file", "apply_patch"],
            requires_gate=False,
        ),
        CrewStage(
            id="gate_authorization",
            title="Mandatory Human Authorization Gate",
            worker_role="reviewer",
            worker_name="GateGuardian",
            description="Requires explicit developer cryptographic approval before privileged execution.",
            dependencies=["hardening_builder"],
            allowed_tools=["request_approval_gate"],
            requires_gate=True,
            gate_risk_level="HIGH",
        ),
    ],
)

BUILTIN_CREW_TEMPLATES: Dict[str, CrewTemplate] = {
    CODING_FLIGHT_TEMPLATE.id: CODING_FLIGHT_TEMPLATE,
    RESEARCH_SWARM_TEMPLATE.id: RESEARCH_SWARM_TEMPLATE,
    SECURITY_AUDIT_TEMPLATE.id: SECURITY_AUDIT_TEMPLATE,
}


def get_crew_template(template_id: str) -> Optional[CrewTemplate]:
    """Retrieve a crew template by ID."""
    return BUILTIN_CREW_TEMPLATES.get(template_id)


def list_crew_templates() -> List[CrewTemplate]:
    """Return all available crew templates."""
    return list(BUILTIN_CREW_TEMPLATES.values())


def build_dag_from_template(template: CrewTemplate, mission_id: str, objective: str) -> DAGGraph:
    """Instantiate an executable DAGGraph from a declarative CrewTemplate."""
    graph = DAGGraph(mission_id=mission_id)
    for stage in template.stages:
        node = DAGNode(
            id=stage.id,
            title=stage.title,
            assigned_role=stage.worker_role,
            assigned_worker_id=stage.worker_name,
            instruction=f"Execute {stage.title} for objective: {objective}. {stage.description}",
            dependencies=list(stage.dependencies),
            status=TaskStatus.PENDING,
            gate_required=stage.requires_gate,
            gate_risk_level=stage.gate_risk_level,
        )
        graph.add_node(node)
    return graph
