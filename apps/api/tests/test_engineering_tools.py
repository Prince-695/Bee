"""Tests for AI Co-Engineer engineering MCP tools (Git, Sandbox Runner, Code Search)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Add tools and packages to path
_REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(_REPO_ROOT / "tools" / "hive-local"))
sys.path.insert(0, str(_REPO_ROOT / "packages" / "python" / "bee-core" / "src"))
sys.path.insert(0, str(_REPO_ROOT / "packages" / "python" / "bee-hive" / "src"))
sys.path.insert(0, str(_REPO_ROOT / "packages" / "python" / "bee-logging" / "src"))

from code_search_mcp_server import code_find_files, code_ripgrep, code_view_file
from git_mcp_server import git_diff, git_log, git_status
from sandbox_runner_mcp_server import run_command, run_test_suite


class TestEngineeringTools(unittest.TestCase):
    def test_git_status_current_repo(self):
        status = git_status(str(_REPO_ROOT))
        self.assertIn("branch", status)
        self.assertIn("is_clean", status)
        self.assertIn("staged", status)

    def test_git_log_retrieval(self):
        commits = git_log(str(_REPO_ROOT), max_count=5)
        self.assertIsInstance(commits, list)
        self.assertGreater(len(commits), 0)
        self.assertIn("hash", commits[0])
        self.assertIn("subject", commits[0])

    def test_sandbox_run_command(self):
        result = run_command("echo 'bee co-engineer sandbox'", cwd=str(_REPO_ROOT))
        self.assertTrue(result["success"])
        self.assertEqual(result["exit_code"], 0)
        self.assertIn("bee co-engineer sandbox", result["stdout"])

    def test_code_find_files(self):
        matches = code_find_files("package.json", path=str(_REPO_ROOT))
        self.assertIsInstance(matches, list)
        self.assertTrue(any("package.json" in m for m in matches))

    def test_code_view_file(self):
        res = code_view_file(str(_REPO_ROOT / "README.md"), start_line=1, line_count=5)
        self.assertTrue(res["success"])
        self.assertIn("1: # Bee", res["content"])

    def test_code_ripgrep(self):
        res = code_ripgrep("Autonomous AI Co-Engineer", path=str(_REPO_ROOT))
        self.assertTrue(res["success"])
        self.assertGreater(res["match_count"], 0)


if __name__ == "__main__":
    unittest.main()
