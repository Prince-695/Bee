# Bee — Agent Guide

Bee is an intelligent worker that receives a task, builds a **Route**, and flies it across **Hive** workers.

## Monorepo layout

- `apps/console` — BEE Console (React + Vite)
- `apps/api` — Bee HTTP gateway (`bee_api`)
- `packages/python/bee-core` — Bee brain
- `packages/python/bee-hive` — Hive Registry + MCP client
- `packages/python/bee-logging` — Flight logs
- `packages/ui` — `@bee/ui`
- `packages/api-client` — `@bee/api-client`
- `tools/hive-local` — local Hive runners
- `docs/terminology.md` — glossary

Deferred: `apps/cli` (bee-cli), `packages/sdk` (bee-sdk) — see docs/sdk-cli-roadmap.md.

## Absolute rules

1. Prefer files under ~250 lines; split helpers when practical.
2. No hardcoded secrets — use `.env` via config.
3. No `print()` in Python library code for product logs — use `bee_logging.write_log()`. Console diagnostics may log via structured helpers.
4. Every I/O path has try/except or try/catch.
5. OAuth / token values are never logged.

## Terminology

See [docs/terminology.md](../docs/terminology.md). Prefer Bee / Hive / Route / Flight in docs, UI copy, and APIs (`route_id`).
