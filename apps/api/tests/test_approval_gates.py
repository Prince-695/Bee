"""Tests for Approval Gate subsystem and resolution lifecycles."""

from __future__ import annotations

import unittest

from bee_core.stores.gate_store import (
    create_gate,
    get_gate,
    list_gates,
    resolve_gate,
)


class TestApprovalGates(unittest.TestCase):
    def test_create_and_get_gate(self):
        gate = create_gate(
            route_id="route-test-123",
            step_num=2,
            server="git",
            tool="git_commit",
            args={"message": "feat: test gate"},
            action_summary="Commit code changes",
        )
        self.assertIsNotNone(gate["gate_id"])
        self.assertEqual(gate["status"], "pending")

        retrieved = get_gate(gate["gate_id"])
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["route_id"], "route-test-123")
        self.assertEqual(retrieved["status"], "pending")

    def test_approve_gate(self):
        gate = create_gate(
            route_id="route-test-456",
            step_num=1,
            server="git",
            tool="git_push",
            args={"branch": "main"},
            action_summary="Push to remote",
        )
        resolved = resolve_gate(gate["gate_id"], "approved")
        self.assertIsNotNone(resolved)
        self.assertEqual(resolved["status"], "approved")
        self.assertIsNotNone(resolved["resolved_at"])

    def test_reject_gate(self):
        gate = create_gate(
            route_id="route-test-789",
            step_num=3,
            server="sandbox",
            tool="run_command",
            args={"command": "rm -rf /"},
            action_summary="Destructive command",
        )
        resolved = resolve_gate(gate["gate_id"], "rejected")
        self.assertIsNotNone(resolved)
        self.assertEqual(resolved["status"], "rejected")

    def test_list_gates_filtering(self):
        route_id = "route-test-filter"
        create_gate(
            route_id=route_id,
            step_num=1,
            server="git",
            tool="git_commit",
            args={},
            action_summary="Commit",
        )
        gates = list_gates(route_id=route_id, status="pending")
        self.assertGreater(len(gates), 0)
        self.assertEqual(gates[0]["route_id"], route_id)


if __name__ == "__main__":
    unittest.main()
