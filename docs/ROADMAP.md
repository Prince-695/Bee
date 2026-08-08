# Bee monorepo plan — built & next

Living plan for the Bee polyglot monorepo. Product language: [terminology.md](terminology.md). Local run: [../run.md](../run.md).

**Bee** (stylized **BEE**) is an intelligent worker that receives a task, figures out what needs to happen, and uses Hive workers to get it done.

---

## Status legend

| Status | Meaning |
|---|---|
| Done | Shipped in the current tree |
| Scaffold | Folder/package reserved; not implemented |
| Planned | Designed; not started |
| Later | Intentionally deferred |

---

## Active sequence (master cutover)

1. Legacy branding wipe — **Done**
2. Hard Route / Flight API cutover — **Done**
3. Auth + CI + `@bee/ui` cutover — **Done**
4. Hive Registry UX + branding tokens — **Done**
5. Flight worker + durable queue — **Done**
6. **bee-sdk / bee-cli** — **Later** (detailed plan: [sdk-cli-roadmap.md](sdk-cli-roadmap.md))

---

## What we built

### Monorepo foundation

| Item | Status | Location |
|---|---|---|
| Flat monorepo | Done | repo root |
| Bee / BEE Console surface | Done | Console + API titles, docs |
| Terminology glossary | Done | [terminology.md](terminology.md) |
| pnpm + Turborepo + justfile | Done | — |
| CI (console + api + codegen:check) | Done | `.github/workflows/ci.yml` |
| Dockerfiles + compose | Done | `infra/` |

### Apps

| App | Status | Notes |
|---|---|---|
| **BEE Console** | Done | Conversation, Route, Hive, Hooks, Status; real auth |
| **Bee API** | Done | Route/Flight + auth + Hive registry |
| **Flight worker** | Done | `apps/worker` + SQLite durable queue |
| **bee-cli** | Later | Scaffold only — see [sdk-cli-roadmap.md](sdk-cli-roadmap.md) |

### Packages

| Package | Status |
|---|---|
| `bee-core` / `bee-hive` / `bee-logging` | Done |
| `@bee/ui` / `@bee/api-client` | Done |
| `@bee/sdk` | Later |

---

## Deferred

### bee-cli / bee-sdk — Later

Full phased build plan (contracts freeze → TS SDK → CLI → optional Python SDK → publish): **[sdk-cli-roadmap.md](sdk-cli-roadmap.md)**.

Placeholders: `apps/cli/README.md`, `packages/sdk/README.md`.

### Other Later items

- Storybook for `@bee/ui`
- Postgres / multi-user Hive workspaces
- npm/PyPI publish
- Eval harness for Route quality

---

## Checklist

### Built

- [x] Monorepo layout + Bee branding
- [x] Route / Flight hard cutover (`route_id`)
- [x] `bee-core` split (planner / flight / hive runtime)
- [x] Bee API + BEE Console + auth
- [x] `@bee/ui` re-exports from Console
- [x] OpenAPI codegen + CI `codegen:check`
- [x] Hive Registry UX
- [x] Flight worker + durable queue

### Later

- [ ] Implement `packages/sdk` (**@bee/sdk**) — [sdk-cli-roadmap.md](sdk-cli-roadmap.md)
- [ ] Implement `apps/cli` (**bee-cli**) — [sdk-cli-roadmap.md](sdk-cli-roadmap.md)
- [ ] Storybook / Postgres / publish
