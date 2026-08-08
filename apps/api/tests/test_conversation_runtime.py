from __future__ import annotations

import tempfile
from pathlib import Path
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from bee_core.executor import conversation_runtime
from bee_core.stores import chat_store, conversation_store


class ConversationRuntimeTests(IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "bee.db"
        self._patchers = [
            patch("bee_core.stores.chat_store.DB_PATH", str(self.db_path)),
            patch("bee_core.stores.conversation_store.DB_PATH", str(self.db_path)),
        ]
        for patcher in self._patchers:
            patcher.start()

        chat_store.init_db()
        conversation_store.init_db()

    def tearDown(self) -> None:
        for patcher in reversed(self._patchers):
            patcher.stop()
        self.temp_dir.cleanup()

    async def test_start_conversation_stays_in_gathering_until_ready(self) -> None:
        with (
            patch.object(
                conversation_runtime,
                "write_log",
                new=AsyncMock(return_value=None),
            ),
            patch.object(
                conversation_runtime,
                "gather_requirements",
                new=AsyncMock(
                    return_value={
                        "assistant_message": "What system is affected, and what outcome do you want?",
                        "can_proceed": False,
                        "missing_info": ["system", "outcome"],
                        "requirement_summary": "User has a problem",
                        "planning_prompt": None,
                    }
                ),
            ),
            patch.object(
                conversation_runtime, "create_route", new=AsyncMock()
            ) as create_route_mock,
        ):
            result = await conversation_runtime.start_conversation("I have a problem")

        self.assertFalse(result["can_proceed"])
        self.assertIsNone(result["route_id"])
        self.assertEqual(result["conversation"]["state"], "gathering")
        self.assertGreaterEqual(len(result["conversation"]["messages"]), 2)
        create_route_mock.assert_not_awaited()

    async def test_handle_turn_creates_route_when_requirements_are_ready(self) -> None:
        dummy_route = {
            "route_id": "route_123",
            "prompt": "User wants a Slack notification flow",
            "route_summary": "Notify Slack when the event occurs",
            "steps": [],
            "step_count": 0,
            "failed_servers": [],
            "status": "pending",
        }

        session = conversation_store.create_conversation_session(
            "Build me a Slack workflow"
        )
        conversation_store.append_conversation_message(
            session["id"], "user", "Build me a Slack workflow"
        )

        with (
            patch.object(
                conversation_runtime,
                "write_log",
                new=AsyncMock(return_value=None),
            ),
            patch.object(
                conversation_runtime,
                "gather_requirements",
                new=AsyncMock(
                    return_value={
                        "assistant_message": "I have enough detail. I’m creating the route now.",
                        "can_proceed": True,
                        "missing_info": [],
                        "requirement_summary": "Build a Slack workflow",
                        "planning_prompt": (
                            "Build a Slack workflow that notifies the team when the event occurs."
                        ),
                    }
                ),
            ),
            patch.object(
                conversation_runtime,
                "create_route",
                new=AsyncMock(return_value=dummy_route),
            ),
        ):
            result = await conversation_runtime.handle_conversation_turn(session["id"])

        self.assertTrue(result["can_proceed"])
        self.assertEqual(result["route_id"], "route_123")
        self.assertEqual(result["conversation"]["state"], "routed")
        self.assertEqual(result["conversation"]["route_id"], "route_123")
        self.assertEqual(result["conversation"]["route_json"]["route_id"], "route_123")
        self.assertGreaterEqual(len(result["conversation"]["messages"]), 3)


if __name__ == "__main__":
    import unittest

    unittest.main()
