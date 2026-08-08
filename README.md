# Bee

Bee is an intelligent worker that receives a task, figures out what needs to happen, and uses Hive workers (MCP tools/services) to get it done.

This monorepo contains:

| Path | Role |
|---|---|
| `apps/console` | **BEE Console** (React + Vite) |
| `apps/api` | **Bee API** (FastAPI gateway) |
| `packages/python/bee-core` | Bee brain (Route / Flight runtime) |
| `packages/python/bee-hive` | Hive Registry + MCP client |
| `packages/python/bee-logging` | Flight logs |
| `packages/ui` | `@bee/ui` |
| `packages/api-client` | `@bee/api-client` |
| `tools/hive-local` | Local Hive runners |

Terminology: [docs/terminology.md](docs/terminology.md). Built vs next: **[docs/ROADMAP.md](docs/ROADMAP.md)**.

## Quick start

Follow **[run.md](run.md)** for venv setup and how to start API + Console manually.
