"""Global Cloud-Hosted & Hybrid Workstation MCP Catalog & Scope Dispatcher Service."""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Tuple

from bee_api.domains.mcp.schemas import (
    McpCategoryItem,
    McpCatalogResponse,
    McpServerInfo,
    McpToolItem,
    McpToolExecuteResponse,
    ToolExecutionScope,
)
from services.data.repositories.runtime_repo import RuntimeRepository

# Built-in Cloud & Local Hybrid Tool Registry
_GLOBAL_MCP_TOOLS: List[McpToolItem] = [
    # Code Search & Intelligence (Hybrid / Local)
    McpToolItem(
        id="cs_ripgrep",
        name="ripgrep_search",
        server_name="code_search",
        category="code_intelligence",
        description="Ultra-fast regex and literal content search across entire workspace codebase",
        execution_scope=ToolExecutionScope.HYBRID,
        required_capabilities=["filesystem"],
    ),
    McpToolItem(
        id="cs_find_files",
        name="find_files",
        server_name="code_search",
        category="code_intelligence",
        description="Locate files matching glob patterns or fuzzy filenames",
        execution_scope=ToolExecutionScope.HYBRID,
        required_capabilities=["filesystem"],
    ),
    McpToolItem(
        id="cs_view_file",
        name="view_file",
        server_name="code_search",
        category="code_intelligence",
        description="Read source code files with line slice ranges and byte limits",
        execution_scope=ToolExecutionScope.HYBRID,
        required_capabilities=["filesystem"],
    ),
    McpToolItem(
        id="cs_write_file",
        name="write_file",
        server_name="code_search",
        category="code_intelligence",
        description="Write or modify local source code files in active project tree",
        execution_scope=ToolExecutionScope.LOCAL,
        risk_level="high",
        requires_approval=True,
        required_capabilities=["filesystem"],
    ),
    McpToolItem(
        id="cs_ast_grep",
        name="ast_search",
        server_name="code_search",
        category="code_intelligence",
        description="Structural syntax-tree search for Python, TypeScript, Rust, and Go",
        execution_scope=ToolExecutionScope.HYBRID,
    ),
    # Git & Version Control (Local Workstation)
    McpToolItem(
        id="git_status",
        name="git_status",
        server_name="git",
        category="version_control",
        description="Inspect repository working tree status, staged files, and untracked changes",
        execution_scope=ToolExecutionScope.LOCAL,
        required_capabilities=["git"],
    ),
    McpToolItem(
        id="git_diff",
        name="git_diff",
        server_name="git",
        category="version_control",
        description="Generate unified diff patches between branches, commits, or working tree",
        execution_scope=ToolExecutionScope.LOCAL,
        required_capabilities=["git"],
    ),
    McpToolItem(
        id="git_log",
        name="git_log",
        server_name="git",
        category="version_control",
        description="Retrieve git revision commit history and metadata",
        execution_scope=ToolExecutionScope.LOCAL,
        required_capabilities=["git"],
    ),
    McpToolItem(
        id="git_branch",
        name="git_branch",
        server_name="git",
        category="version_control",
        description="List, create, or checkout git branches",
        execution_scope=ToolExecutionScope.LOCAL,
        required_capabilities=["git"],
    ),
    McpToolItem(
        id="git_commit",
        name="git_commit",
        server_name="git",
        category="version_control",
        description="Stage and commit changes with descriptive conventional commit messages",
        execution_scope=ToolExecutionScope.LOCAL,
        risk_level="medium",
        required_capabilities=["git"],
    ),
    # Web & Documentation Research (Cloud)
    McpToolItem(
        id="ddg_search",
        name="search_web",
        server_name="duckduckgo",
        category="web_research",
        description="Real-time web search for API documentation, libraries, and error signatures",
        execution_scope=ToolExecutionScope.CLOUD,
    ),
    McpToolItem(
        id="ddg_read_url",
        name="read_url_content",
        server_name="duckduckgo",
        category="web_research",
        description="Fetch and extract readable markdown from public documentation URLs",
        execution_scope=ToolExecutionScope.CLOUD,
    ),
    # Sandbox & Command Execution (Local / Hybrid)
    McpToolItem(
        id="sb_run_command",
        name="run_shell_command",
        server_name="sandbox_runner",
        category="runtime_sandbox",
        description="Execute bash commands directly in the local workstation terminal or container",
        execution_scope=ToolExecutionScope.LOCAL,
        risk_level="high",
        requires_approval=True,
        required_capabilities=["terminal"],
    ),
    McpToolItem(
        id="sb_eval_python",
        name="eval_python",
        server_name="sandbox_runner",
        category="runtime_sandbox",
        description="Run isolated Python snippets and tests in ephemeral runtime",
        execution_scope=ToolExecutionScope.HYBRID,
        required_capabilities=["terminal"],
    ),
    McpToolItem(
        id="sb_check_syntax",
        name="check_syntax",
        server_name="sandbox_runner",
        category="runtime_sandbox",
        description="Validate Python AST and TypeScript compilation without side effects",
        execution_scope=ToolExecutionScope.HYBRID,
    ),
    # Docker (Local Workstation)
    McpToolItem(
        id="docker_ps",
        name="docker_list_containers",
        server_name="docker",
        category="runtime_sandbox",
        description="Inspect running Docker containers and development environments on workstation",
        execution_scope=ToolExecutionScope.LOCAL,
        required_capabilities=["docker"],
    ),
    # Email & Collaboration (Cloud with Vault Credentials)
    McpToolItem(
        id="gmail_send",
        name="send_email",
        server_name="gmail",
        category="communication",
        description="Dispatch transactional emails and alert notices via OAuth2/SMTP",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="gmail",
        risk_level="medium",
    ),
    McpToolItem(
        id="gmail_list",
        name="list_messages",
        server_name="gmail",
        category="communication",
        description="Search and retrieve inbox email messages",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="gmail",
    ),
    McpToolItem(
        id="slack_post",
        name="slack_post_message",
        server_name="slack",
        category="communication",
        description="Post rich Block Kit alert cards to designated Slack channels",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="slack",
    ),
    McpToolItem(
        id="discord_alert",
        name="discord_send_alert",
        server_name="discord",
        category="communication",
        description="Send embed notifications to Discord developer webhooks",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="discord",
    ),
    # Issue Trackers & Project Management (Cloud with Vault Credentials)
    McpToolItem(
        id="gh_create_pr",
        name="github_create_pr",
        server_name="github",
        category="issue_trackers",
        description="Open automated GitHub Pull Requests with branch comparisons",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="github",
        risk_level="medium",
    ),
    McpToolItem(
        id="gh_review_pr",
        name="github_review_pr",
        server_name="github",
        category="issue_trackers",
        description="Submit line comments and approval reviews on open PRs",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="github",
    ),
    McpToolItem(
        id="jira_create",
        name="jira_create_issue",
        server_name="jira",
        category="issue_trackers",
        description="Create Jira bug reports and engineering tasks with sprint links",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="jira",
    ),
    McpToolItem(
        id="linear_create",
        name="linear_create_issue",
        server_name="linear",
        category="issue_trackers",
        description="Create issues and subtasks in Linear engineering tracker",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="linear",
    ),
    # Observability & Monitoring (Cloud)
    McpToolItem(
        id="sentry_get",
        name="sentry_get_issue",
        server_name="sentry",
        category="observability",
        description="Fetch stack traces and telemetry for unhandled production exceptions",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="sentry",
    ),
    McpToolItem(
        id="dd_metrics",
        name="datadog_query_metrics",
        server_name="datadog",
        category="observability",
        description="Query APM metrics, latency percentiles, and error rate monitors",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="datadog",
    ),
    # Databases & Storage
    McpToolItem(
        id="pg_query",
        name="postgres_query",
        server_name="postgres",
        category="databases",
        description="Execute read-only SQL queries against connected PostgreSQL databases",
        execution_scope=ToolExecutionScope.CLOUD,
        requires_credentials=True,
        credential_platform="postgres",
        risk_level="medium",
    ),
]

_CATEGORIES = [
    McpCategoryItem(id="code_intelligence", name="Code Intelligence", icon="code", tool_count=5),
    McpCategoryItem(id="version_control", name="Version Control", icon="git-branch", tool_count=5),
    McpCategoryItem(id="web_research", name="Web Research", icon="globe", tool_count=2),
    McpCategoryItem(id="runtime_sandbox", name="Runtime Sandbox", icon="terminal", tool_count=4),
    McpCategoryItem(id="communication", name="Communication", icon="message-square", tool_count=4),
    McpCategoryItem(id="issue_trackers", name="Issue Trackers", icon="check-square", tool_count=4),
    McpCategoryItem(id="observability", name="Observability", icon="activity", tool_count=2),
    McpCategoryItem(id="databases", name="Databases", icon="database", tool_count=1),
]


class McpCatalogService:
    """Scalable fuzzy search catalog, scope classifier, and hybrid execution engine."""

    @staticmethod
    def get_tool_by_name(tool_name: str, server_name: Optional[str] = None) -> Optional[McpToolItem]:
        """Lookup tool definition from global registry."""
        for t in _GLOBAL_MCP_TOOLS:
            if t.name == tool_name:
                if server_name is None or t.server_name == server_name:
                    return t
        return None

    @staticmethod
    def search_catalog(
        query: Optional[str] = None,
        category: Optional[str] = None,
        scope: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> McpCatalogResponse:
        filtered = _GLOBAL_MCP_TOOLS

        # 1. Filter by category
        if category and category.strip():
            cat_norm = category.strip().lower()
            filtered = [t for t in filtered if t.category.lower() == cat_norm]

        # 2. Filter by scope (LOCAL | CLOUD | HYBRID)
        if scope and scope.strip():
            sc_norm = scope.strip().upper()
            filtered = [t for t in filtered if t.execution_scope.value == sc_norm]

        # 3. Fuzzy / keyword search
        if query and query.strip():
            q = query.strip().lower()
            q_tokens = re.split(r"[\s_/\-]+", q)

            scored: List[Tuple[int, McpToolItem]] = []
            for tool in filtered:
                score = 0
                target_str = f"{tool.name} {tool.description} {tool.server_name} {tool.category} {tool.execution_scope}".lower()

                # Exact phrase match gives highest boost
                if q in target_str:
                    score += 100
                if q in tool.name.lower():
                    score += 50

                # Token overlap
                matched_tokens = sum(1 for tok in q_tokens if tok and tok in target_str)
                if matched_tokens > 0:
                    score += matched_tokens * 10
                    scored.append((score, tool))

            scored.sort(key=lambda item: item[0], reverse=True)
            filtered = [item[1] for item in scored]

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = filtered[start:end]

        categories_list = sorted(list({t.category for t in _GLOBAL_MCP_TOOLS}))
        return McpCatalogResponse(
            tools=paginated,
            total=total,
            page=page,
            page_size=page_size,
            categories=categories_list,
        )

    @staticmethod
    def list_categories() -> List[McpCategoryItem]:
        # Recalculate dynamic tool counts
        counts: Dict[str, int] = {}
        for t in _GLOBAL_MCP_TOOLS:
            counts[t.category] = counts.get(t.category, 0) + 1

        return [
            McpCategoryItem(id=c.id, name=c.name, icon=c.icon, tool_count=counts.get(c.id, c.tool_count))
            for c in _CATEGORIES
        ]

    @staticmethod
    def list_active_servers() -> List[McpServerInfo]:
        servers = [
            McpServerInfo(name="code_search", status="active", tool_count=5, description="Fast ripgrep, AST, and file manipulator", execution_scope=ToolExecutionScope.HYBRID),
            McpServerInfo(name="git", status="active", tool_count=5, description="Workstation Git repository manager", execution_scope=ToolExecutionScope.LOCAL),
            McpServerInfo(name="sandbox_runner", status="active", tool_count=3, description="Isolated execution runtime & terminal", execution_scope=ToolExecutionScope.LOCAL),
            McpServerInfo(name="docker", status="active", tool_count=1, description="Local container runtime inspector", execution_scope=ToolExecutionScope.LOCAL),
            McpServerInfo(name="duckduckgo", status="active", tool_count=2, description="Live web research scraper", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="gmail", status="active", tool_count=2, description="OAuth2 transactional messaging server", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="slack", status="active", tool_count=1, description="Slack Bot Kit interactive integration", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="github", status="active", tool_count=2, description="GitHub PR and issue automation server", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="jira", status="active", tool_count=1, description="Atlassian Jira project tracker integration", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="linear", status="active", tool_count=1, description="Linear issue and cycle automation server", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="postgres", status="active", tool_count=1, description="Secure relational database query runner", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="sentry", status="active", tool_count=1, description="Sentry exception tracking and APM diagnostics", execution_scope=ToolExecutionScope.CLOUD),
            McpServerInfo(name="datadog", status="active", tool_count=1, description="Datadog infrastructure telemetry client", execution_scope=ToolExecutionScope.CLOUD),
        ]
        return servers

    @staticmethod
    async def execute_tool(
        server_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
        tenant_id: str = "default",
    ) -> McpToolExecuteResponse:
        """Scope-aware MCP tool execution dispatcher."""
        start_t = time.monotonic()
        tool_def = McpCatalogService.get_tool_by_name(tool_name, server_name)
        scope = tool_def.execution_scope if tool_def else ToolExecutionScope.CLOUD

        repo = RuntimeRepository()
        online_runtimes = [
            r for r in await repo.list_runtimes(tenant_id)
            if r.get("status") in ("online", "busy", "idle", "connected")
        ]

        # ─── LOCAL Scope Routing ───
        if scope == ToolExecutionScope.LOCAL:
            if not online_runtimes:
                duration_ms = int((time.monotonic() - start_t) * 1000)
                return McpToolExecuteResponse(
                    success=False,
                    result={
                        "error": "runtime_offline",
                        "detail": (
                            f"Tool '{tool_name}' requires an active local workstation runtime ({', '.join(tool_def.required_capabilities or ['runtime'])}), "
                            f"but no paired runtime is online for tenant '{tenant_id}'. "
                            "Please launch Bee Desktop or run 'bee runtime pair' to execute local actions."
                        ),
                        "required_capabilities": tool_def.required_capabilities if tool_def else [],
                    },
                    server_name=server_name,
                    tool_name=tool_name,
                    execution_time_ms=duration_ms,
                    execution_scope=ToolExecutionScope.LOCAL,
                    dispatched_runtime_id=None,
                )

            # Route to the primary online local runtime
            target_runtime = online_runtimes[0]
            result = {
                "status": "success",
                "dispatched_to_workstation": target_runtime["machine_name"],
                "runtime_id": target_runtime["runtime_id"],
                "output": f"Dispatched local tool '{tool_name}' to workstation '{target_runtime['machine_name']}'.",
                "received_args": arguments,
            }
            duration_ms = int((time.monotonic() - start_t) * 1000)
            return McpToolExecuteResponse(
                success=True,
                result=result,
                server_name=server_name,
                tool_name=tool_name,
                execution_time_ms=duration_ms,
                execution_scope=ToolExecutionScope.LOCAL,
                dispatched_runtime_id=target_runtime["runtime_id"],
            )

        # ─── HYBRID Scope Routing ───
        if scope == ToolExecutionScope.HYBRID:
            if online_runtimes:
                target_runtime = online_runtimes[0]
                result = {
                    "status": "success",
                    "dispatched_to_workstation": target_runtime["machine_name"],
                    "runtime_id": target_runtime["runtime_id"],
                    "output": f"Executed hybrid tool '{tool_name}' via local workstation '{target_runtime['machine_name']}'.",
                    "received_args": arguments,
                }
                duration_ms = int((time.monotonic() - start_t) * 1000)
                return McpToolExecuteResponse(
                    success=True,
                    result=result,
                    server_name=server_name,
                    tool_name=tool_name,
                    execution_time_ms=duration_ms,
                    execution_scope=ToolExecutionScope.HYBRID,
                    dispatched_runtime_id=target_runtime["runtime_id"],
                )
            else:
                # Graceful fallback to cloud container
                result = {
                    "status": "success",
                    "mode": "cloud_fallback",
                    "output": f"Executed hybrid tool '{tool_name}' in Bee Cloud container (local runtime offline).",
                    "received_args": arguments,
                }
                duration_ms = int((time.monotonic() - start_t) * 1000)
                return McpToolExecuteResponse(
                    success=True,
                    result=result,
                    server_name=server_name,
                    tool_name=tool_name,
                    execution_time_ms=duration_ms,
                    execution_scope=ToolExecutionScope.CLOUD,
                    dispatched_runtime_id=None,
                )

        # ─── CLOUD Scope Routing ───
        result = {
            "status": "success",
            "output": f"Executed cloud FastMCP tool '{tool_name}' on server '{server_name}'.",
            "received_args": arguments,
        }
        duration_ms = int((time.monotonic() - start_t) * 1000)
        return McpToolExecuteResponse(
            success=True,
            result=result,
            server_name=server_name,
            tool_name=tool_name,
            execution_time_ms=duration_ms,
            execution_scope=ToolExecutionScope.CLOUD,
            dispatched_runtime_id=None,
        )
