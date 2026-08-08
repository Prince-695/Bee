# Bee architecture

Bee is a polyglot monorepo:

- `apps/console` — BEE Console (React + Vite)
- `apps/api` — Bee HTTP gateway (FastAPI)
- `packages/python/bee-core` — Bee brain (routes, flights, conversations)
- `packages/python/bee-hive` — Hive Registry + MCP client
- `packages/python/bee-logging` — Flight logs
- `packages/ui` — `@bee/ui`
- `packages/api-client` — `@bee/api-client`
- `tools/hive-local` — local Hive runners

See [../terminology.md](../terminology.md) for product language.

For built vs future work (Flight worker, Hive UX, deferred bee-sdk/bee-cli, etc.), see [../ROADMAP.md](../ROADMAP.md).
