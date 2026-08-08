# Bee terminology

**Bee** (stylized **BEE**) is an intelligent worker that receives a task, figures out what needs to happen, and uses different tools/services to get it done.

Prefer Bee terms in docs, UI copy, and APIs.

| Concept | Bee term | Notes |
|---|---|---|
| Main agent | **Bee** | The planner/executor brain |
| MCP servers | **Hive** | Connected capability hosts |
| MCP tools | **Workers / Tools** | Individual callable capabilities |
| Tool registry | **Hive Registry** | Catalog of available Hive workers |
| Execution | **Flight** | A run of a Route |
| Plan | **Route** | Ordered/DAG steps Bee will fly |
| Agent workspace | **Hive** | Workspace sense of Hive (same family metaphor) |
| UI | **BEE Console** | Web app (`apps/console`) |
| CLI (later) | **bee-cli** | `apps/cli` — deferred |
| SDK (later) | **bee-sdk** | `packages/sdk` — deferred |

API identifiers use `route_id` / Route / Flight (not plan/execution).
