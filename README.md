# Bee

Bee is an Autonomous AI Co-Engineer — a self-healing, agentic teammate delivered as a native desktop application. It receives engineering tasks (bug fixes, PR reviews, CI failures, incident alerts), plans multi-step execution Routes, and uses Hive workers (MCP tools/services) to autonomously resolve them.

This monorepo contains:

| Path | Role |
|---|---|
| `apps/console` | **BEE Desktop / Console** (React + Vite + Tauri v2) |
| `apps/api` | **Bee API** (FastAPI gateway) |
| `apps/worker` | **Flight Worker** (durable queue processor) |
| `packages/python/bee-core` | Bee brain (Route planner / Flight executor / self-healing loop) |
| `packages/python/bee-hive` | Hive Registry + MCP client |
| `packages/python/bee-logging` | Structured Flight audit logs |
| `packages/ui` | `@bee/ui` |
| `packages/api-client` | `@bee/api-client` |
| `tools/hive-local` | Local Hive MCP servers (Git, Sandbox, Code Search, Gmail, GitHub, Webhooks) |

Terminology: [docs/terminology.md](docs/terminology.md). Architecture: [docs/architecture/README.md](docs/architecture/README.md). Built vs next: **[docs/ROADMAP.md](docs/ROADMAP.md)**.

## Quick start

Follow **[run.md](run.md)** for venv setup and how to start API + Console manually.
