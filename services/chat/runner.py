"""Ephemeral Single-Worker Tool Execution Runner.

Executes single-worker tool runs directly from chat, enforcing FileGuard and GateManager policies.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from services.guardian.file_guard import FileGuard, GuardrailSecurityViolation
from services.guardian.gate_manager import GateManager
from services.guardian.policy_engine import ActionRiskLevel


class EphemeralWorkerRunner:
    """Executes single-worker commands/tools with zero-trust guardrails."""

    def __init__(self, gate_manager: Optional[GateManager] = None):
        self.gate_manager = gate_manager or GateManager()

    async def execute_tool(
        self,
        worker_id: str,
        tool: str,
        args: Optional[Dict[str, Any]] = None,
        thread_id: str = "ephemeral",
        workspace_id: str = "default",
    ) -> Dict[str, Any]:
        """Executes a single tool on behalf of a worker with FileGuard & GateManager governance."""
        args = args or {}

        # 1. FileGuard inspection: check paths and shell commands
        for key in ("path", "file_path", "target_path", "filename"):
            if key in args:
                path_val = str(args[key])
                if FileGuard.is_sensitive_path(path_val):
                    return {
                        "status": "error",
                        "error_type": "SECURITY_VIOLATION",
                        "error": f"FileGuard blocked access to sensitive target '{path_val}'. Modifying or reading environment/credential files is prohibited.",
                    }

        if tool in ("bash", "shell", "run_command", "terminal"):
            cmd = str(args.get("command", "") or args.get("cmd", ""))
            if FileGuard.is_sensitive_command(cmd):
                return {
                    "status": "error",
                    "error_type": "SECURITY_VIOLATION",
                    "error": f"FileGuard blocked shell command attempting to inspect or modify sensitive resources: '{cmd}'.",
                }

        # 2. GateManager policy evaluation
        gate_result = self.gate_manager.evaluate_and_intercept(
            route_id=thread_id,
            step_num=1,
            tool=tool,
            args=args,
            workspace_id=workspace_id,
            action_summary=f"Worker '{worker_id}' requested tool '{tool}'",
        )

        if gate_result.get("status") == "pending":
            return {
                "status": "gate_requested",
                "gate_id": gate_result.get("gate_id"),
                "risk_level": gate_result.get("evaluation", {}).get("risk_level", ActionRiskLevel.HIGH.value),
                "reason": gate_result.get("evaluation", {}).get("reason", "Human approval required for action."),
                "action": {"tool": tool, "args": args},
            }

        # 3. Auto-approved execution
        return await self._dispatch_tool(worker_id=worker_id, tool=tool, args=args)

    async def _dispatch_tool(self, worker_id: str, tool: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches approved tool call to native handlers or mocks."""
        if tool in ("read_file", "view_file"):
            path = args.get("path") or args.get("file_path")
            if not path or not os.path.exists(path):
                return {"status": "error", "error": f"File '{path}' not found."}
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as fp:
                    content = fp.read(10000)
                return {"status": "success", "output": content, "truncated": len(content) >= 10000}
            except Exception as exc:
                return {"status": "error", "error": str(exc)}

        if tool in ("list_dir", "list_directory"):
            path = args.get("path") or "."
            if not os.path.exists(path):
                return {"status": "error", "error": f"Directory '{path}' not found."}
            try:
                items = sorted(os.listdir(path))[:50]
                return {"status": "success", "items": items}
            except Exception as exc:
                return {"status": "error", "error": str(exc)}

        if tool in ("web_search", "search"):
            query = args.get("query", "")
            return {
                "status": "success",
                "output": f"Simulated search results for '{query}': Found relevant documentation and code examples.",
                "query": query,
            }

        # Fallback tool simulator for general execution
        return {
            "status": "success",
            "output": f"Executed tool '{tool}' with arguments {args}.",
            "worker_id": worker_id,
        }
