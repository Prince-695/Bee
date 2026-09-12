from __future__ import annotations

import argparse
import asyncio
import json
import time

from bee_core.executor.flight_executor import execute_flight
from bee_core.executor.hive_runtime import pre_initialize_runtime, shutdown_runtime
from bee_core.executor.route_planner import create_route
from bee_core.stores.chat_store import init_db, save_chat
from bee_core.stores.flight_queue_store import (
    claim_next_ready_flight,
    complete_flight_task,
    init_flight_queue_db,
)
from bee_logging import write_log


async def process_one() -> bool:
    task = claim_next_ready_flight()
    if task is None:
        return False

    task_id = task["id"]
    event_data = task.get("event_data") or {}
    followup = (
        f"{task['user_prompt']}\n\n"
        "The event you were waiting for just fired. Event data:\n"
        f"{json.dumps(event_data, indent=2)}\n\n"
        "Now complete the action you were supposed to take."
    )

    await write_log("INFO", "worker", "flight_claimed", {"task_id": task_id})
    try:
        route = await create_route(followup)
        result = await execute_flight(route["route_id"])
        save_chat(
            prompt=task["user_prompt"],
            route={
                "task_id": task_id,
                "webhook_type": task.get("webhook_type"),
                "followup_route_id": route["route_id"],
            },
            result=result,
            status="completed",
            chat_id=task_id,
            route_id=task_id,
        )
        complete_flight_task(
            task_id, route_id=route["route_id"], result=result, failed=False
        )
        await write_log("INFO", "worker", "flight_done", {"task_id": task_id})
    except Exception as error:
        complete_flight_task(
            task_id,
            route_id=None,
            result={"error": str(error)},
            failed=True,
        )
        await write_log(
            "ERROR",
            "worker",
            "flight_failed",
            {"task_id": task_id, "error": str(error)},
        )
    return True


async def run_loop(poll_seconds: float) -> None:
    init_db()
    init_flight_queue_db()
    await pre_initialize_runtime()
    print("Bee Flight worker running…")
    try:
        while True:
            worked = await process_one()
            if not worked:
                await asyncio.sleep(poll_seconds)
    finally:
        await shutdown_runtime()


def main() -> None:
    parser = argparse.ArgumentParser(description="Bee Flight worker")
    parser.add_argument(
        "--poll", type=float, default=2.0, help="Idle poll interval seconds"
    )
    args = parser.parse_args()
    asyncio.run(run_loop(args.poll))


if __name__ == "__main__":
    main()
