# Bee architecture

**Bee** is an Autonomous AI Co-Engineer delivered as a native desktop application. It autonomously handles engineering tasks — PR reviews, bug fixes, test generation, CI/CD remediation, and incident triage — using a self-healing DAG execution engine backed by pluggable MCP tool servers (the Hive).

See [../terminology.md](../terminology.md) for product language.

---

## System overview

```text
╔══════════════════════════════════════════════════════════════════════════╗
║                      🖥️  BEE DESKTOP APPLICATION                       ║
║                        (.exe / .dmg / .AppImage)                       ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────────┐  ║
║  │  Native Shell (Tauri v2)                                         │  ║
║  │   • Window management, system tray, native notifications        │  ║
║  │   • Spawns & supervises Python backend as sidecar process       │  ║
║  └────────────────────────────┬─────────────────────────────────────┘  ║
║                               │                                        ║
║  ┌────────────────────────────┴─────────────────────────────────────┐  ║
║  │  Frontend: BEE Console (React 18 + Vite + @bee/ui)               │  ║
║  │   • Teammate Board — active task stream                          │  ║
║  │   • Mission Control — live Flight DAG + step telemetry           │  ║
║  │   • Approval Gates — 1-click authorize for critical actions      │  ║
║  │   • Code Diff Viewer + Terminal Log Stream                       │  ║
║  └────────────────────────────┬─────────────────────────────────────┘  ║
║                               │ HTTP / SSE                             ║
║  ┌────────────────────────────┴─────────────────────────────────────┐  ║
║  │  Backend Engine (FastAPI + bee-core + bee-hive)                   │  ║
║  │   • Route Planner — LLM-powered multi-step DAG generation       │  ║
║  │   • Flight Executor — runs steps + self-heals on failure        │  ║
║  │   • Hive Registry — discovers & invokes MCP tool servers        │  ║
║  │   • Durable Queue — SQLite-backed async Flight queue            │  ║
║  │   • Structured Logs — JSONL Flight audit trail                  │  ║
║  └──────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Monorepo layout

Bee is a polyglot monorepo (pnpm + Turborepo for TS, pip/venv for Python):

| Path | Role |
|---|---|
| `apps/console` | **BEE Desktop / Console** — React + Vite + Tauri v2 native shell |
| `apps/api` | **Bee API** — FastAPI HTTP gateway (runs as local sidecar) |
| `apps/worker` | **Flight Worker** — background durable queue processor |
| `apps/cli` | **bee-cli** — scaffolded (deferred) |
| `packages/python/bee-core` | Bee brain — Route planner, Flight executor, self-healing loop |
| `packages/python/bee-hive` | Hive Registry + MCP client |
| `packages/python/bee-logging` | Structured JSONL Flight audit logs |
| `packages/ui` | `@bee/ui` — shared UI component library |
| `packages/api-client` | `@bee/api-client` — generated OpenAPI TypeScript client |
| `tools/hive-local` | Local Hive MCP servers (Git, Sandbox, Code Search, DuckDuckGo, Gmail, GitHub, Webhooks) |
| `infra/` | Dockerfiles + Compose stacks |

---

## Core execution flow

```text
 Task / Issue / Alert
        │
        ▼
 ┌──────────────┐     ┌───────────────────┐
 │  Bee API      │────▶│  Route Planner     │  ← LLM generates execution DAG
 └──────┬───────┘     └────────┬──────────┘
        │                      │
        ▼                      ▼
 ┌──────────────┐     ┌───────────────────┐
 │  Flight      │────▶│  Hive Registry     │  ← Discovers & invokes MCP tools
 │  Executor    │     └────────┬──────────┘
 └──────┬───────┘              │
        │              ┌───────┴──────────────────────────────┐
        │              │  Hive Workers                         │
        │              │  ├─ Git Worker (branch, diff, PR)     │
        │              │  ├─ Sandbox Worker (test, lint, build)│
        │              │  ├─ Code Search (AST, ripgrep)        │
        │              │  ├─ Comms Worker (Slack, Discord)      │
        │              │  └─ Ops Worker (Sentry, CI logs)       │
        │              └──────────────────────────────────────┘
        │
        ▼
 ┌──────────────┐
 │  Self-Heal   │  ← On step failure: analyze error → re-plan → retry
 │  Loop        │
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │  Approval    │  ← Pause for human confirmation on critical actions
 │  Gate        │
 └──────┬───────┘
        │
        ▼
    Result / PR / Report
```

---

## Self-healing execution model

Unlike traditional workflow engines that crash on unexpected errors, Bee uses an **adaptive feedback loop**:

1. **Step executes** (e.g. run `pytest`).
2. **If it fails**, the error output (stack trace, exit code, stderr) is fed back into the Route Planner.
3. **Planner generates a remediation sub-route** (e.g. fix the broken import, update mock data).
4. **Executor runs the fix**, then retries the original step.
5. **Retry limits** prevent infinite loops — after N attempts, Bee escalates to the user via an Approval Gate.

---

## Key design principles

- **Agentic, not assistive** — Bee doesn't suggest; it executes.
- **Self-healing** — Errors trigger adaptive re-planning, not crashes.
- **Human-in-the-loop** — Critical actions require explicit Approval Gate confirmation.
- **Observable** — Every Flight step is logged, streamed, and visualized in Mission Control.
- **Extensible** — New capabilities = new MCP server in `tools/hive-local`.
- **Desktop-native** — Runs locally via Tauri v2 with system tray and native notifications.

---

For built vs future work, see [../ROADMAP.md](../ROADMAP.md).
