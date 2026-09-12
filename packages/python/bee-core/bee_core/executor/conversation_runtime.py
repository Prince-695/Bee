from __future__ import annotations

from typing import Any

from bee_core.executor.conversation_gather import gather_requirements
from bee_core.executor.route_planner import create_route
from bee_core.stores.chat_store import save_chat
from bee_core.stores.conversation_store import (
    append_conversation_message,
    create_conversation_session,
    get_conversation_session,
    update_conversation_session,
)
from bee_logging import write_log


async def start_conversation(user_message: str) -> dict[str, Any]:
    session = create_conversation_session(user_message)
    append_conversation_message(
        session["id"], "user", user_message, {"source": "initial"}
    )
    save_chat(
        prompt=user_message,
        route={"conversation_id": session["id"], "state": "gathering"},
        result=None,
        status="gathering",
        chat_id=session["id"],
        route_id=session["id"],
    )
    return await handle_conversation_turn(session["id"])


async def send_conversation_message(
    conversation_id: str, message: str
) -> dict[str, Any]:
    session = get_conversation_session(conversation_id)
    if session is None:
        raise RuntimeError(f"Conversation {conversation_id} not found")

    append_conversation_message(
        conversation_id, "user", message, {"source": "followup"}
    )
    return await handle_conversation_turn(conversation_id)


async def handle_conversation_turn(conversation_id: str) -> dict[str, Any]:
    session = get_conversation_session(conversation_id)
    if session is None:
        raise RuntimeError(f"Conversation {conversation_id} not found")

    if session.get("state") == "routed" and session.get("route_id"):
        return {
            "conversation": session,
            "assistant_message": session.get("assistant_message")
            or "The route is ready.",
            "can_proceed": True,
            "missing_info": session.get("missing_info", []),
            "route_id": session.get("route_id"),
            "route": session.get("route_json"),
        }

    # Accept prior "planned" rows if migration left state string
    if session.get("state") == "planned" and session.get("route_id"):
        return {
            "conversation": session,
            "assistant_message": session.get("assistant_message")
            or "The route is ready.",
            "can_proceed": True,
            "missing_info": session.get("missing_info", []),
            "route_id": session.get("route_id"),
            "route": session.get("route_json"),
        }

    await write_log(
        "INFO",
        "conversation",
        "turn_received",
        {
            "conversation_id": conversation_id,
            "message_count": len(session.get("messages", [])),
        },
    )

    gather_result = await gather_requirements(session)
    assistant_message = gather_result["assistant_message"]

    append_conversation_message(
        conversation_id,
        "assistant",
        assistant_message,
        {
            "can_proceed": gather_result["can_proceed"],
            "missing_info": gather_result["missing_info"],
        },
    )

    if not gather_result["can_proceed"]:
        updated = update_conversation_session(
            conversation_id,
            state="gathering",
            assistant_message=assistant_message,
            can_proceed=False,
            missing_info=gather_result["missing_info"],
            planning_prompt=None,
        )
        return {
            "conversation": updated,
            "assistant_message": assistant_message,
            "can_proceed": False,
            "missing_info": gather_result["missing_info"],
            "route_id": None,
            "route": None,
        }

    planning_prompt = str(
        gather_result.get("planning_prompt")
        or gather_result["requirement_summary"]
        or session.get("initial_prompt", "")
    )
    planning_message = (
        "I have enough context now. I’m building the route and will show it next."
    )
    append_conversation_message(
        conversation_id, "assistant", planning_message, {"state": "routing"}
    )
    update_conversation_session(
        conversation_id,
        state="routing",
        assistant_message=planning_message,
        can_proceed=True,
        missing_info=[],
        planning_prompt=planning_prompt,
    )

    await write_log(
        "INFO", "conversation", "routing_started", {"conversation_id": conversation_id}
    )
    route = await create_route(planning_prompt)

    finalized = update_conversation_session(
        conversation_id,
        state="routed",
        assistant_message=planning_message,
        route_id=route["route_id"],
        route_json=route,
        can_proceed=True,
        missing_info=[],
    )
    append_conversation_message(
        conversation_id,
        "assistant",
        f"Route ready. I created {route['step_count']} steps and opened it for review.",
        {"route_id": route["route_id"], "state": "routed"},
    )
    save_chat(
        prompt=finalized["initial_prompt"],
        route=route,
        result=None,
        status="routed",
        chat_id=conversation_id,
        route_id=route["route_id"],
    )

    session = get_conversation_session(conversation_id)
    return {
        "conversation": session,
        "assistant_message": planning_message,
        "can_proceed": True,
        "missing_info": [],
        "route_id": route["route_id"],
        "route": route,
    }


async def get_conversation(conversation_id: str) -> dict[str, Any] | None:
    return get_conversation_session(conversation_id)
