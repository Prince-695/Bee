"""Sandbox Runner MCP Server — isolated test, lint, and build execution for Bee."""

from __future__ import annotations

import os
import shlex
import subprocess
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

mcp = FastMCP("sandbox")


def _execute_subprocess(
    command_str: str,
    cwd: str = ".",
    timeout_seconds: int = 120,
    custom_env: dict[str, str] | None = None,
) -> dict[str, Any]:
    target_dir = Path(cwd).resolve()
    if not target_dir.exists():
        return {
            "success": False,
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Working directory does not exist: {cwd}",
            "duration_ms": 0,
        }

    env = os.environ.copy()
    if custom_env:
        env.update(custom_env)

    start_time = time.perf_counter()
    try:
        process = subprocess.run(
            command_str,
            shell=True,
            cwd=str(target_dir),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            env=env,
            check=False,
        )
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return {
            "success": process.returncode == 0,
            "exit_code": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "duration_ms": duration_ms,
            "timed_out": False,
        }
    except subprocess.TimeoutExpired as expired:
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return {
            "success": False,
            "exit_code": 124,
            "stdout": (expired.stdout or "").decode() if isinstance(expired.stdout, bytes) else (expired.stdout or ""),
            "stderr": f"Process timed out after {timeout_seconds} seconds.",
            "duration_ms": duration_ms,
            "timed_out": True,
        }
    except Exception as error:
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return {
            "success": False,
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Subprocess execution error: {error}",
            "duration_ms": duration_ms,
            "timed_out": False,
        }


@mcp.tool()
def run_command(
    command: str,
    cwd: str = ".",
    timeout_seconds: int = 120,
) -> dict[str, Any]:
    """Execute a general shell command safely inside the sandbox workspace."""
    if not command.strip():
        return {"success": False, "error": "Command string cannot be empty"}
    return _execute_subprocess(command, cwd=cwd, timeout_seconds=timeout_seconds)


@mcp.tool()
def run_test_suite(
    runner: str = "pytest",
    args: str = "",
    cwd: str = ".",
    timeout_seconds: int = 180,
) -> dict[str, Any]:
    """Execute test runners (pytest, npm test, vitest, cargo test, go test) and capture full output."""
    runner_clean = runner.strip().lower()
    base_commands: dict[str, str] = {
        "pytest": "pytest",
        "npm": "npm test",
        "pnpm": "pnpm test",
        "vitest": "npx vitest run",
        "jest": "npx jest",
        "cargo": "cargo test",
        "go": "go test ./...",
    }

    cmd = base_commands.get(runner_clean, runner_clean)
    if args.strip():
        cmd = f"{cmd} {args.strip()}"

    res = _execute_subprocess(cmd, cwd=cwd, timeout_seconds=timeout_seconds)
    return {
        "runner": runner,
        "command": cmd,
        "passed": res["success"],
        "exit_code": res["exit_code"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "duration_ms": res["duration_ms"],
        "timed_out": res.get("timed_out", False),
    }


@mcp.tool()
def run_linter(
    linter: str = "ruff",
    args: str = "",
    cwd: str = ".",
    fix: bool = False,
) -> dict[str, Any]:
    """Execute linters (ruff, eslint, flake8, mypy, tsc) to check or auto-fix code quality."""
    linter_clean = linter.strip().lower()
    fix_flag = " --fix" if fix and linter_clean in ["ruff", "eslint"] else ""

    base_commands: dict[str, str] = {
        "ruff": f"ruff check{fix_flag}",
        "eslint": f"npx eslint .{fix_flag}",
        "flake8": "flake8 .",
        "mypy": "mypy .",
        "tsc": "npx tsc --noEmit",
    }

    cmd = base_commands.get(linter_clean, linter_clean)
    if args.strip():
        cmd = f"{cmd} {args.strip()}"

    res = _execute_subprocess(cmd, cwd=cwd, timeout_seconds=90)
    return {
        "linter": linter,
        "command": cmd,
        "clean": res["success"],
        "exit_code": res["exit_code"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "duration_ms": res["duration_ms"],
    }


@mcp.tool()
def run_build(
    build_tool: str = "vite",
    args: str = "",
    cwd: str = ".",
) -> dict[str, Any]:
    """Execute build pipelines (vite, tsc, cargo, next, pnpm build)."""
    tool_clean = build_tool.strip().lower()
    base_commands: dict[str, str] = {
        "vite": "npx vite build",
        "tsc": "npx tsc",
        "cargo": "cargo build --release",
        "pnpm": "pnpm build",
        "npm": "npm run build",
    }

    cmd = base_commands.get(tool_clean, tool_clean)
    if args.strip():
        cmd = f"{cmd} {args.strip()}"

    res = _execute_subprocess(cmd, cwd=cwd, timeout_seconds=180)
    return {
        "build_tool": build_tool,
        "command": cmd,
        "success": res["success"],
        "exit_code": res["exit_code"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "duration_ms": res["duration_ms"],
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")
