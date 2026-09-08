# Bee

Bee is an Autonomous AI Co-Engineer — a self-healing, agentic teammate delivered as a native desktop application. It receives engineering tasks (bug fixes, PR reviews, CI failures, incident alerts), plans multi-step execution Routes, and uses Hive workers (MCP tools/services) to autonomously resolve them.

This monorepo contains:

| Path | Role |
|---|---|
| `apps/console` | **BEE Desktop / Console** (React 19 + Vite + Electron) |
| `apps/web` | **Bee Web Platform** (Public showcase & documentation) |
| `apps/api` | **Bee API** (FastAPI gateway & /v1 platform) |
| `apps/worker` | **Flight Worker** (durable queue processor) |
| `packages/python/bee-core` | Bee brain (Route planner / Flight executor / self-healing loop) |
| `packages/python/bee-hive` | Hive Registry + MCP client |
| `packages/python/bee-logging` | Structured Flight audit logs |
| `packages/ui` | `@bee/ui` (Shared design primitives) |
| `packages/api-client` | `@bee/api-client` (OpenAPI TypeScript client) |
| `tools/hive-local` | Local FastMCP servers (Git, Sandbox, Code Search, DuckDuckGo, Gmail) |

Terminology: [docs/terminology.md](docs/terminology.md). Architecture: [architecture.md](architecture.md). SaaS Roadmap: [docs/architecture/saas-master-plan.md](docs/architecture/saas-master-plan.md). Built vs next: **[docs/ROADMAP.md](docs/ROADMAP.md)**.

## Quick start

Follow **[run.md](run.md)** for venv setup and how to start API + Console manually.
