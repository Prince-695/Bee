"""Curated MCP Integrations & Worker Tool Provisioning Router."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bee_api.core.dependencies import get_current_tenant
from bee_api.domains.credentials.service import CredentialVaultService
from bee_api.domains.mcp.schemas import (
    ConnectIntegrationRequest,
    IntegrationItemResponse,
    IntegrationsListResponse,
    ToolExecutionScope,
    WorkerProvisionRequest,
    WorkerProvisionResponse,
)
from bee_api.domains.mcp.service import _GLOBAL_MCP_TOOLS
from services.data.repositories.worker_repo import WorkerRepository

router = APIRouter(prefix="/v1/mcp", tags=["Model Context Protocol (MCP) Catalog"])

_CURATED_INTEGRATIONS: List[Dict[str, Any]] = [
    {
        "id": "github",
        "name": "GitHub",
        "category": "Version Control & PRs",
        "description": "Automate pull requests, code reviews, and commit tracking directly on GitHub.",
        "icon": "github",
        "requires_credentials": True,
        "credential_keys": ["PERSONAL_ACCESS_TOKEN"],
        "tools": ["github_create_pr", "github_review_pr"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://docs.github.com/en/rest",
    },
    {
        "id": "slack",
        "name": "Slack",
        "category": "Team Communication",
        "description": "Post flight completions, critical approval requests, and incident cards to Slack channels.",
        "icon": "message-square",
        "requires_credentials": True,
        "credential_keys": ["BOT_TOKEN"],
        "tools": ["slack_post_message"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://api.slack.com/bot-users",
    },
    {
        "id": "jira",
        "name": "Atlassian Jira",
        "category": "Issue Tracking",
        "description": "Create and update engineering issues, bug reports, and sprint tasks in Jira.",
        "icon": "check-square",
        "requires_credentials": True,
        "credential_keys": ["API_TOKEN", "BASE_URL", "EMAIL"],
        "tools": ["jira_create_issue"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
    },
    {
        "id": "linear",
        "name": "Linear",
        "category": "Issue Tracking",
        "description": "High-velocity issue tracking, triage cycles, and project roadmaps.",
        "icon": "check-circle",
        "requires_credentials": True,
        "credential_keys": ["API_KEY"],
        "tools": ["linear_create_issue"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://developers.linear.app/docs/graphql/working-with-the-graphql-api",
    },
    {
        "id": "postgres",
        "name": "PostgreSQL",
        "category": "Databases",
        "description": "Execute secure, schema-aware queries and inspect relational data models.",
        "icon": "database",
        "requires_credentials": True,
        "credential_keys": ["CONNECTION_STRING"],
        "tools": ["postgres_query"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://www.postgresql.org/docs/",
    },
    {
        "id": "docker",
        "name": "Docker Local",
        "category": "Runtime Sandbox",
        "description": "Inspect local container clusters, service health, and isolated development environments.",
        "icon": "box",
        "requires_credentials": False,
        "credential_keys": [],
        "tools": ["docker_list_containers"],
        "execution_scope": ToolExecutionScope.LOCAL,
        "documentation_url": "https://docs.docker.com/engine/api/",
    },
    {
        "id": "duckduckgo",
        "name": "DuckDuckGo Web Search",
        "category": "Web Research",
        "description": "Perform live web searches and fetch documentation markdown without API keys.",
        "icon": "globe",
        "requires_credentials": False,
        "credential_keys": [],
        "tools": ["search_web", "read_url_content"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://duckduckgo.com/",
    },
    {
        "id": "sentry",
        "name": "Sentry",
        "category": "Observability",
        "description": "Fetch error stack traces, unhandled exceptions, and performance telemetry.",
        "icon": "activity",
        "requires_credentials": True,
        "credential_keys": ["AUTH_TOKEN"],
        "tools": ["sentry_get_issue"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://docs.sentry.io/api/",
    },
    {
        "id": "datadog",
        "name": "Datadog",
        "category": "Observability",
        "description": "Query APM metrics, latency percentiles, and host health indicators.",
        "icon": "bar-chart-2",
        "requires_credentials": True,
        "credential_keys": ["API_KEY", "APP_KEY"],
        "tools": ["datadog_query_metrics"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://docs.datadoghq.com/api/",
    },
    {
        "id": "gmail",
        "name": "Google Workspace Gmail",
        "category": "Team Communication",
        "description": "Dispatch automated email notifications and search project inbox threads.",
        "icon": "mail",
        "requires_credentials": True,
        "credential_keys": ["CLIENT_ID", "REFRESH_TOKEN"],
        "tools": ["send_email", "list_messages"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://developers.google.com/gmail/api",
    },
    {
        "id": "discord",
        "name": "Discord Webhooks",
        "category": "Team Communication",
        "description": "Broadcast agent status cards and engineering notices to Discord channels.",
        "icon": "send",
        "requires_credentials": True,
        "credential_keys": ["WEBHOOK_URL"],
        "tools": ["discord_send_alert"],
        "execution_scope": ToolExecutionScope.CLOUD,
        "documentation_url": "https://discord.com/developers/docs/resources/webhook",
    },
    {
        "id": "filesystem",
        "name": "Local Filesystem Guard",
        "category": "Code Intelligence",
        "description": "Safe, path-restricted file inspection and modification on the local workstation.",
        "icon": "file-code",
        "requires_credentials": False,
        "credential_keys": [],
        "tools": ["view_file", "write_file", "find_files"],
        "execution_scope": ToolExecutionScope.LOCAL,
        "documentation_url": "https://github.com/modelcontextprotocol/servers",
    },
]


@router.get("/integrations", response_model=IntegrationsListResponse)
async def list_curated_integrations(
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> IntegrationsListResponse:
    """List all 12+ curated integrations with live connection and credential vaulting status."""
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    credentials = await CredentialVaultService.list_credentials(tenant_id)
    cred_map = {c.platform.lower(): c.masked_preview for c in credentials}

    items = []
    for intg in _CURATED_INTEGRATIONS:
        p_id = intg["id"]
        requires_creds = intg["requires_credentials"]
        masked_preview = cred_map.get(p_id)

        # If it doesn't require credentials (like Docker or DuckDuckGo), it's available by default
        is_connected = bool(masked_preview) if requires_creds else True

        items.append(
            IntegrationItemResponse(
                id=intg["id"],
                name=intg["name"],
                category=intg["category"],
                description=intg["description"],
                icon=intg["icon"],
                is_connected=is_connected,
                masked_credential_preview=masked_preview,
                requires_credentials=requires_creds,
                credential_keys=intg["credential_keys"],
                tools=intg["tools"],
                execution_scope=intg["execution_scope"],
                documentation_url=intg.get("documentation_url"),
            )
        )

    return IntegrationsListResponse(integrations=items, count=len(items))


@router.post("/integrations/{platform}/connect", response_model=IntegrationItemResponse)
async def connect_curated_integration(
    platform: str,
    body: ConnectIntegrationRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> IntegrationItemResponse:
    """Safely store encrypted platform credentials in enterprise vault and mark integration connected."""
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    matched_intg = next((i for i in _CURATED_INTEGRATIONS if i["id"] == platform.lower()), None)
    if not matched_intg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{platform}' not found in curated catalog",
        )

    stored_cred = await CredentialVaultService.store_credential(
        tenant_id=tenant_id,
        platform=platform.lower(),
        credential_key=body.credential_key,
        credential_value=body.credential_value,
        label=body.label or f"{matched_intg['name']} Integration Secret",
    )

    return IntegrationItemResponse(
        id=matched_intg["id"],
        name=matched_intg["name"],
        category=matched_intg["category"],
        description=matched_intg["description"],
        icon=matched_intg["icon"],
        is_connected=True,
        masked_credential_preview=stored_cred.masked_preview,
        requires_credentials=matched_intg["requires_credentials"],
        credential_keys=matched_intg["credential_keys"],
        tools=matched_intg["tools"],
        execution_scope=matched_intg["execution_scope"],
        documentation_url=matched_intg.get("documentation_url"),
    )


@router.post("/integrations/{platform}/disconnect")
async def disconnect_curated_integration(
    platform: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Revoke credentials and disconnect a curated integration."""
    tenant_id = tenant.get("tenant_id") or tenant.get("id") or "default"
    deleted_count = await CredentialVaultService.delete_platform_credentials(
        tenant_id=tenant_id,
        platform=platform.lower(),
    )
    return {
        "success": True,
        "platform": platform.lower(),
        "revoked_credentials_count": deleted_count,
        "message": f"Successfully disconnected integration '{platform}'",
    }


@router.get("/workers/{worker_id}/tools")
async def get_worker_tools(
    worker_id: str,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> Dict[str, Any]:
    """Retrieve allowed tools for a worker and all available tools in the MCP catalog."""
    repo = WorkerRepository()
    worker = repo.get_worker(worker_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker '{worker_id}' not found",
        )

    allowed = worker.get("allowed_tools") or []
    all_catalog_tools = [
        {
            "name": t.name,
            "server_name": t.server_name,
            "category": t.category,
            "description": t.description,
            "execution_scope": t.execution_scope.value,
            "is_allowed": t.name in allowed,
        }
        for t in _GLOBAL_MCP_TOOLS
    ]

    return {
        "worker_id": worker["id"],
        "name": worker["name"],
        "role": worker["role"],
        "allowed_tools": allowed,
        "available_catalog_tools": all_catalog_tools,
    }


@router.post("/workers/{worker_id}/provision", response_model=WorkerProvisionResponse)
async def provision_worker_tools(
    worker_id: str,
    body: WorkerProvisionRequest,
    tenant: Dict[str, Any] = Depends(get_current_tenant),
) -> WorkerProvisionResponse:
    """Provision or deprovision allowed tools on a specific worker."""
    repo = WorkerRepository()
    worker = repo.get_worker(worker_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker '{worker_id}' not found",
        )

    updated = repo.update_worker_tools(worker_id=worker_id, allowed_tools=body.allowed_tools)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update worker tool provisioning",
        )

    return WorkerProvisionResponse(
        worker_id=updated["id"],
        name=updated["name"],
        role=updated["role"],
        allowed_tools=updated["allowed_tools"],
        updated_at=str(updated.get("updated_at") or ""),
    )
