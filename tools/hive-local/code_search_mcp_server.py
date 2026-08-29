"""Code Search MCP Server — ripgrep, AST, and symbol indexing for Bee."""

from __future__ import annotations

import fnmatch
import os
import re
import subprocess
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

mcp = FastMCP("code_search")


@mcp.tool()
def code_ripgrep(
    query: str,
    path: str = ".",
    is_regex: bool = False,
    file_glob: str = "",
    max_results: int = 50,
) -> dict[str, Any]:
    """Search for code strings or regular expressions across directories."""
    target_dir = Path(path).resolve()
    if not target_dir.exists():
        return {"success": False, "error": f"Path not found: {path}", "matches": []}

    limit = max(1, min(max_results, 200))
    args = ["rg", "--json", f"--max-count={limit}"]
    if not is_regex:
        args.append("-F")
    if file_glob.strip():
        args.extend(["-g", file_glob.strip()])
    args.extend([query, str(target_dir)])

    try:
        process = subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
        )
        matches: list[dict[str, Any]] = []
        for line in process.stdout.splitlines():
            try:
                import json
                data = json.loads(line)
                if data.get("type") == "match":
                    match_data = data.get("data", {})
                    file_path = match_data.get("path", {}).get("text", "")
                    line_number = match_data.get("line_number", 0)
                    line_content = match_data.get("lines", {}).get("text", "").strip()
                    matches.append(
                        {
                            "file": file_path,
                            "line": line_number,
                            "content": line_content,
                        }
                    )
            except Exception:
                continue
        return {
            "success": True,
            "query": query,
            "match_count": len(matches),
            "matches": matches[:limit],
        }
    except FileNotFoundError:
        # Fallback to python-based walk if rg is not installed
        return _python_search_fallback(query, target_dir, is_regex, file_glob, limit)
    except Exception as error:
        return {"success": False, "error": str(error), "matches": []}


def _python_search_fallback(
    query: str,
    target_dir: Path,
    is_regex: bool,
    file_glob: str,
    limit: int,
) -> dict[str, Any]:
    matches: list[dict[str, Any]] = []
    pattern = re.compile(query if is_regex else re.escape(query))
    for root, _, files in os.walk(target_dir):
        if any(ignored in root for ignored in [".git", "node_modules", ".venv", "__pycache__"]):
            continue
        for file in files:
            if file_glob and not fnmatch.fnmatch(file, file_glob):
                continue
            full_path = Path(root) / file
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, start=1):
                        if pattern.search(line):
                            matches.append(
                                {
                                    "file": str(full_path),
                                    "line": idx,
                                    "content": line.strip(),
                                }
                            )
                            if len(matches) >= limit:
                                return {
                                    "success": True,
                                    "query": query,
                                    "match_count": len(matches),
                                    "matches": matches,
                                }
            except Exception:
                continue
    return {
        "success": True,
        "query": query,
        "match_count": len(matches),
        "matches": matches,
    }


@mcp.tool()
def code_find_files(
    pattern: str,
    path: str = ".",
    max_results: int = 100,
) -> list[str]:
    """Find file paths matching a given filename pattern or glob."""
    target_dir = Path(path).resolve()
    if not target_dir.exists():
        return []
    limit = max(1, min(max_results, 500))
    results: list[str] = []

    for root, _, files in os.walk(target_dir):
        if any(ignored in root for ignored in [".git", "node_modules", ".venv", "__pycache__"]):
            continue
        for file in files:
            if fnmatch.fnmatch(file, pattern):
                results.append(str(Path(root) / file))
                if len(results) >= limit:
                    return results
    return results


@mcp.tool()
def code_view_file(
    file_path: str,
    start_line: int = 1,
    line_count: int = 100,
) -> dict[str, Any]:
    """Read a specific slice of a file with line numbers."""
    target_file = Path(file_path).resolve()
    if not target_file.is_file():
        return {"success": False, "error": f"File not found: {file_path}", "content": ""}

    try:
        with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
            all_lines = f.readlines()

        total = len(all_lines)
        start = max(1, start_line)
        end = min(total, start + max(1, line_count) - 1)
        sliced = [
            f"{i}: {all_lines[i - 1]}" for i in range(start, end + 1)
        ]
        return {
            "success": True,
            "file": str(target_file),
            "total_lines": total,
            "start_line": start,
            "end_line": end,
            "content": "".join(sliced),
        }
    except Exception as error:
        return {"success": False, "error": str(error), "content": ""}


if __name__ == "__main__":
    mcp.run(transport="stdio")
