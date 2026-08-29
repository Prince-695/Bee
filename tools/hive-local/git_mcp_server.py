"""Git MCP Server — autonomous git operations for Bee AI Co-Engineer."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

mcp = FastMCP("git")


def _run_git(args: list[str], cwd: str = ".") -> dict[str, Any]:
    target_dir = Path(cwd).resolve()
    if not target_dir.exists():
        return {
            "success": False,
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Target directory does not exist: {cwd}",
        }
    try:
        process = subprocess.run(
            ["git"] + args,
            cwd=str(target_dir),
            capture_output=True,
            text=True,
            check=False,
            timeout=60,
        )
        return {
            "success": process.returncode == 0,
            "exit_code": process.returncode,
            "stdout": process.stdout.strip(),
            "stderr": process.stderr.strip(),
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "exit_code": 124,
            "stdout": "",
            "stderr": "Git command timed out after 60 seconds",
        }
    except Exception as error:
        return {
            "success": False,
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Failed to execute git command: {error}",
        }


@mcp.tool()
def git_status(repo_path: str = ".") -> dict[str, Any]:
    """Get the current branch status, staged, modified, and untracked files."""
    branch_res = _run_git(["rev-parse", "--abbrev-ref", "HEAD"], cwd=repo_path)
    status_res = _run_git(["status", "--porcelain=v1"], cwd=repo_path)
    if not branch_res["success"]:
        return {"error": branch_res["stderr"] or "Not a git repository"}

    current_branch = branch_res["stdout"]
    lines = status_res["stdout"].splitlines() if status_res["stdout"] else []
    modified_files: list[str] = []
    untracked_files: list[str] = []
    staged_files: list[str] = []

    for line in lines:
        if len(line) < 3:
            continue
        index_status = line[0]
        worktree_status = line[1]
        file_name = line[3:].strip()
        if index_status in ["M", "A", "D", "R"]:
            staged_files.append(file_name)
        if worktree_status in ["M", "D"]:
            modified_files.append(file_name)
        elif index_status == "?" and worktree_status == "?":
            untracked_files.append(file_name)

    return {
        "branch": current_branch,
        "is_clean": len(lines) == 0,
        "staged": staged_files,
        "modified": modified_files,
        "untracked": untracked_files,
        "raw_status": status_res["stdout"],
    }


@mcp.tool()
def git_diff(
    repo_path: str = ".",
    staged: bool = False,
    file_path: str = "",
) -> dict[str, Any]:
    """View uncommitted or staged git diffs."""
    args = ["diff"]
    if staged:
        args.append("--cached")
    if file_path:
        args.extend(["--", file_path])
    res = _run_git(args, cwd=repo_path)
    return {
        "success": res["success"],
        "diff": res["stdout"],
        "error": res["stderr"] if not res["success"] else None,
    }


@mcp.tool()
def git_create_branch(
    repo_path: str = ".",
    branch_name: str = "",
    checkout: bool = True,
) -> dict[str, Any]:
    """Create a new git branch and optionally switch to it."""
    if not branch_name:
        return {"success": False, "error": "branch_name is required"}
    args = ["checkout", "-b", branch_name] if checkout else ["branch", branch_name]
    res = _run_git(args, cwd=repo_path)
    return {
        "success": res["success"],
        "branch": branch_name,
        "output": res["stdout"] or res["stderr"],
    }


@mcp.tool()
def git_checkout(repo_path: str = ".", target: str = "") -> dict[str, Any]:
    """Checkout an existing branch or commit reference."""
    if not target:
        return {"success": False, "error": "target is required"}
    res = _run_git(["checkout", target], cwd=repo_path)
    return {
        "success": res["success"],
        "target": target,
        "output": res["stdout"] or res["stderr"],
    }


@mcp.tool()
def git_commit(
    repo_path: str = ".",
    message: str = "",
    all_tracked: bool = True,
    files: list[str] | None = None,
) -> dict[str, Any]:
    """Stage changes and create a git commit."""
    if not message:
        return {"success": False, "error": "Commit message is required"}

    if files:
        for file_to_add in files:
            add_res = _run_git(["add", file_to_add], cwd=repo_path)
            if not add_res["success"]:
                return {"success": False, "error": add_res["stderr"]}
    elif all_tracked:
        add_res = _run_git(["add", "-A"], cwd=repo_path)
        if not add_res["success"]:
            return {"success": False, "error": add_res["stderr"]}

    commit_res = _run_git(["commit", "-m", message], cwd=repo_path)
    return {
        "success": commit_res["success"],
        "message": message,
        "output": commit_res["stdout"] or commit_res["stderr"],
    }


@mcp.tool()
def git_log(repo_path: str = ".", max_count: int = 10) -> list[dict[str, str]]:
    """Retrieve recent commit history."""
    count = max(1, min(max_count, 50))
    res = _run_git(
        [
            "log",
            f"-n{count}",
            "--pretty=format:%H%x09%an%x09%ad%x09%s",
            "--date=short",
        ],
        cwd=repo_path,
    )
    if not res["success"] or not res["stdout"]:
        return []

    commits: list[dict[str, str]] = []
    for line in res["stdout"].splitlines():
        parts = line.split("\t")
        if len(parts) >= 4:
            commits.append(
                {
                    "hash": parts[0],
                    "author": parts[1],
                    "date": parts[2],
                    "subject": parts[3],
                }
            )
    return commits


if __name__ == "__main__":
    mcp.run(transport="stdio")
