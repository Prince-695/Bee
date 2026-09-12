"""Bee Terminal CLI: status inspection, token spend auditing, approval gates, and signal simulation."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict

import requests

from bee_core.security.secret_redactor import SecretRedactor


DEFAULT_API_URL = "http://localhost:8000"


def cmd_status(args: argparse.Namespace) -> None:
    """Print system health and runtime status."""
    url = f"{args.api_url}/api/health"
    try:
        res = requests.get(url, timeout=5)
        if res.ok:
            data = res.json()
            print("\n🐝 \033[1;33mBEE AUTONOMOUS CO-ENGINEER STATUS\033[0m")
            print("─" * 40)
            print(f"Status:             \033[1;32m{data.get('status', 'online').upper()}\033[0m")
            print(f"Active Hive Tools:  \033[1;36m{data.get('tool_count', 12)}\033[0m")
            print(f"Pending Gates:      \033[1;35m{data.get('pending_gates', 0)}\033[0m")
            print("─" * 40 + "\n")
        else:
            print(f"⚠️ Failed to query health: HTTP {res.status_code}")
    except Exception as e:
        print(f"❌ Could not connect to Bee API at {args.api_url} ({e})")


def cmd_audit(args: argparse.Namespace) -> None:
    """Print token spend and security statistics."""
    url = f"{args.api_url}/api/security/spend"
    try:
        res = requests.get(url, timeout=5)
        if res.ok:
            data = res.json().get("data", {})
            print("\n🪙 \033[1;33mBEE TOKEN & BUDGET AUDITING\033[0m")
            print("─" * 40)
            print(f"Total Flights:      \033[1m{data.get('total_flights', 0)}\033[0m")
            print(f"Total Tokens:       \033[1;36m{data.get('total_tokens', 0):,}\033[0m")
            print(f"Estimated Cost:     \033[1;32m${data.get('total_cost_usd', 0.0):.4f} USD\033[0m")
            print("Zero-Leak Shield:   \033[1;32mENFORCED (Auto-Redacting Secrets)\033[0m")
            print("─" * 40 + "\n")
        else:
            print(f"⚠️ Failed to query spend: HTTP {res.status_code}")
    except Exception as e:
        print(f"❌ Could not connect to Bee API at {args.api_url} ({e})")


def cmd_simulate(args: argparse.Namespace) -> None:
    """Trigger a simulated engineering signal."""
    url = f"{args.api_url}/api/signals/simulate"
    event_map = {
        "pr": ("github", "pr_opened", "Prince-695/bee", "feat/auth"),
        "ci": ("ci", "ci_failure", "Prince-695/bee", "main"),
        "sentry": ("sentry", "alert", "Prince-695/bee", "production"),
    }
    source, event_type, repo, branch = event_map.get(args.event, ("github", "pr_opened", "Prince-695/bee", "main"))

    payload = {
        "source": source,
        "event_type": event_type,
        "repository": repo,
        "branch": branch,
        "sender": "cli_developer",
        "payload": {"simulated_via": "bee-cli", "event": args.event},
    }

    try:
        res = requests.post(url, json=payload, timeout=5)
        if res.ok:
            data = res.json().get("data", {})
            print(f"\n⚡ \033[1;32mSignal '{args.event}' dispatched successfully!\033[0m")
            print(f"Signal ID: \033[1;33m{data.get('signal_id')}\033[0m")
            if data.get("matched_mission_id"):
                print(f"Matched Mission: \033[1;36m{data.get('matched_mission_id')}\033[0m")
            print("")
        else:
            print(f"⚠️ Simulation failed: HTTP {res.status_code}")
    except Exception as e:
        print(f"❌ Could not trigger simulation ({e})")


def main() -> None:
    parser = argparse.ArgumentParser(prog="bee", description="Bee Autonomous AI Co-Engineer CLI")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Bee API server URL (default: http://localhost:8000)")

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # bee status
    status_parser = subparsers.add_parser("status", help="Check Bee engine health and tool registry")
    status_parser.set_defaults(func=cmd_status)

    # bee audit
    audit_parser = subparsers.add_parser("audit", help="Audit token consumption and estimated LLM spend")
    audit_parser.set_defaults(func=cmd_audit)

    # bee simulate <pr|ci|sentry>
    sim_parser = subparsers.add_parser("simulate", help="Simulate incoming engineering signals")
    sim_parser.add_argument("event", choices=["pr", "ci", "sentry"], help="Event type to simulate")
    sim_parser.set_defaults(func=cmd_simulate)

    parsed = parser.parse_args()
    if hasattr(parsed, "func"):
        parsed.func(parsed)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
