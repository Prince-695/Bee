# Bee terminology

**Bee** (stylized **BEE**) is an Autonomous AI Co-Engineer — a self-healing, agentic teammate that lives inside your development environment. It receives engineering tasks (bug fixes, PR reviews, CI failures, incident alerts), plans multi-step execution strategies, and uses Hive workers (MCP tools/services) to autonomously resolve them.

Prefer Bee terms in docs, UI copy, and APIs.

---

## Core concepts

| Concept | Bee term | Notes |
|---|---|---|
| Main agent | **Bee** | The planner/executor brain — your AI Co-Engineer |
| MCP servers | **Hive** | Connected capability hosts (Git, Sandbox, Slack, Sentry, etc.) |
| MCP tools | **Workers / Tools** | Individual callable capabilities within a Hive server |
| Tool registry | **Hive Registry** | Catalog of available Hive workers |
| Execution plan (DAG) | **Route** | Ordered/DAG steps Bee will fly to accomplish a task |
| Execution run | **Flight** | A run of a Route — streaming real-time telemetry |
| Agent workspace | **Hive** | Workspace sense of Hive (same family metaphor) |

## Application surfaces

| Surface | Bee term | Notes |
|---|---|---|
| Desktop app | **BEE Desktop** | Native cross-platform app (Tauri v2) — `apps/console` |
| Web UI | **BEE Console** | Browser-based fallback — same React codebase |
| CLI (later) | **bee-cli** | `apps/cli` — deferred |
| SDK (later) | **bee-sdk** | `packages/sdk` — deferred |

## Engineering teammate concepts

| Concept | Bee term | Notes |
|---|---|---|
| Test/build feedback loop | **Self-Heal** | When a Flight step fails, Bee re-plans and retries with a fix |
| Human confirmation step | **Approval Gate** | Pauses Flight for user approval before critical actions (merge, deploy, migrate) |
| Isolated command runner | **Sandbox** | Safe execution environment for tests, linters, and builds |
| Active task stream | **Teammate Board** | Live dashboard showing what Bee is currently working on |
| Flight visual graph | **Mission Control** | Real-time DAG visualizer in the Console with step-level telemetry |

---

## API identifiers

API identifiers use `route_id` / Route / Flight (not plan/execution).

Approval gates use `gate_id` with status `pending | approved | rejected`.
