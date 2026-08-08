"""Hive Registry — catalog of available Hive (MCP) servers / workers."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Final

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[5]
_API_ROOT = _REPO_ROOT / "apps" / "api"
_HIVE_LOCAL = _REPO_ROOT / "tools" / "hive-local"

load_dotenv(_API_ROOT / ".env", override=True)
load_dotenv(_REPO_ROOT / ".env", override=False)


def _read_env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _read_env_any(*names: str, default: str = "") -> str:
    for name in names:
        value = _read_env(name)
        if value:
            return value
    return default


_DEFAULT_PYTHON_BIN = str(_REPO_ROOT / ".venv" / "bin" / "python")
MCP_PYTHON_BIN: Final[str] = _read_env_any(
    "BEE_PYTHON_BIN", default=_DEFAULT_PYTHON_BIN
)
if not Path(MCP_PYTHON_BIN).exists():
    MCP_PYTHON_BIN = "python"

# Hive Registry
MCP_SERVERS: Final[dict[str, dict[str, object]]] = {
    "github": {
        "command": "github-mcp-server",
        "args": ["stdio"],
        "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": _read_env("GITHUB_PERSONAL_ACCESS_TOKEN"),
        },
    },
    "slack": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env": {
            "SLACK_BOT_TOKEN": _read_env("SLACK_BOT_TOKEN"),
            "SLACK_TEAM_ID": _read_env("SLACK_TEAM_ID"),
            "PATH": _read_env("PATH"),
        },
    },
    "jira": {
        "command": "npx",
        "args": ["-y", "-p", "mcp-atlassian", "-p", "jsdom", "mcp-atlassian"],
        "env": {
            "ATLASSIAN_BASE_URL": _read_env_any("ATLASSIAN_BASE_URL", "JIRA_URL"),
            "ATLASSIAN_EMAIL": _read_env_any("ATLASSIAN_EMAIL", "JIRA_EMAIL"),
            "ATLASSIAN_API_TOKEN": _read_env_any(
                "ATLASSIAN_API_TOKEN", "JIRA_API_TOKEN"
            ),
            "JIRA_URL": _read_env("JIRA_URL"),
            "JIRA_USERNAME": _read_env("JIRA_EMAIL"),
            "JIRA_API_TOKEN": _read_env("JIRA_API_TOKEN"),
            "NODE_ENV": "production",
            "LOG_LEVEL": "error",
            "NO_COLOR": "1",
            "FORCE_COLOR": "0",
            "PATH": _read_env("PATH"),
        },
    },
    "notion": {
        "command": "npx",
        "args": ["-y", "@notionhq/notion-mcp-server"],
        "env": {
            "OPENAPI_MCP_HEADERS": (
                '{"Authorization": "Bearer '
                + _read_env("NOTION_API_TOKEN")
                + '", "Notion-Version": "2022-06-28"}'
            ),
            "PATH": _read_env("PATH"),
        },
    },
    "postgres": {
        "command": "npx",
        "args": [
            "-y",
            "@modelcontextprotocol/server-postgres",
            _read_env("POSTGRES_CONNECTION_STRING"),
        ],
        "env": {
            "PATH": _read_env("PATH"),
        },
    },
    "linear": {
        "command": "npx",
        "args": ["-y", "linear-mcp-server"],
        "env": {
            "LINEAR_API_KEY": _read_env("LINEAR_API_KEY"),
            "PATH": _read_env("PATH"),
        },
    },
    "gmail": {
        "command": MCP_PYTHON_BIN,
        "args": [str(_HIVE_LOCAL / "gmail_mcp_server.py")],
        "env": {
            "GMAIL_CREDENTIALS_PATH": _read_env(
                "GMAIL_CREDENTIALS_PATH", str(_API_ROOT / "gmail_credentials.json")
            ),
            "GMAIL_TOKEN_PATH": _read_env(
                "GMAIL_TOKEN_PATH", str(_API_ROOT / "token.json")
            ),
            "PATH": _read_env("PATH"),
        },
    },
    "filesystem": {
        "command": "npx",
        "args": [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            _read_env("FILESYSTEM_PATH", str(_API_ROOT)),
        ],
        "env": {
            "PATH": _read_env("PATH"),
        },
    },
    "duckduckgo": {
        "command": MCP_PYTHON_BIN,
        "args": [str(_HIVE_LOCAL / "duckduckgo_mcp_server.py")],
        "env": {
            "PATH": _read_env("PATH"),
        },
    },
}

HIVE_REGISTRY = MCP_SERVERS
