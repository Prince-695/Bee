# Bee monorepo plan — built & next

Living plan for the Bee polyglot monorepo. Product language: [terminology.md](terminology.md). Architecture: [architecture/README.md](architecture/README.md). Local run: [../run.md](../run.md).

**Bee** (stylized **BEE**) is an Autonomous AI Co-Engineer — a self-healing, agentic teammate delivered as a native desktop application. It receives engineering tasks, plans multi-step execution Routes, and uses Hive workers to autonomously resolve them.

---

## Status legend

| Status | Meaning |
|---|---|
| Done | Shipped in the current tree |
| In Progress | Actively being built |
| Scaffold | Folder/package reserved; not implemented |
| Planned | Designed; not started |
| Later | Intentionally deferred |

---

## Active sequence

1. Legacy branding wipe — **Done**
2. Hard Route / Flight API cutover — **Done**
3. Auth + CI + `@bee/ui` cutover — **Done**
4. Hive Registry UX + branding tokens — **Done**
5. Flight worker + durable queue — **Done**
6. **AI Co-Engineer Hive Tools** (Git, Sandbox, Code Search) — **In Progress**
7. **Self-Healing Execution Loop** in `bee-core` — **Planned**
8. **Desktop App (Tauri v2)** wrapping BEE Console — **Planned**
9. **bee-sdk / bee-cli** — **Later** (detailed plan: [sdk-cli-roadmap.md](sdk-cli-roadmap.md))

---

## What we built

### Monorepo foundation

| Item | Status | Location |
|---|---|---|
| Flat monorepo | Done | repo root |
| Bee / BEE Console surface | Done | Console + API titles, docs |
| Terminology glossary | Done | [terminology.md](terminology.md) |
| Architecture overview | Done | [architecture/README.md](architecture/README.md) |
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

## In progress — AI Co-Engineer capabilities

### Phase 1: Engineering Hive Tools

New MCP tool servers in `tools/hive-local` to give Bee the hands and eyes of a developer:

| Tool | Purpose | Status |
|---|---|---|
| **Git MCP Server** | Branch, commit, diff, PR creation, code checkout | Planned |
| **Sandbox Runner MCP** | Execute tests, linters, and builds safely; capture stdout/stderr/exit | Planned |
| **Code Search MCP** | AST + ripgrep-based symbol search across large repos | Planned |

### Phase 2: Self-Healing Execution Loop

Modifications to `packages/python/bee-core`:

| Item | Purpose | Status |
|---|---|---|
| **Adaptive Flight Executor** | On step failure, feed error back to planner for remediation sub-route | Planned |
| **Approval Gates** | Pause Flights for human confirmation before critical actions | Planned |
| **Retry Limits & Escalation** | Prevent infinite loops; escalate to user after N retries | Planned |

### Phase 3: Desktop Application (Tauri v2)

| Item | Purpose | Status |
|---|---|---|
| **Tauri v2 integration** | Native desktop shell (.exe / .dmg / .AppImage) in `apps/console` | Planned |
| **Sidecar process management** | Spawn and supervise local Bee API from the desktop app | Planned |
| **System tray + notifications** | Quick-status tray icon; native OS notifications on Flight completion | Planned |
| **Teammate Board UI** | Active task feed showing what Bee is coding/testing in real time | Planned |
| **Mission Control UI** | Live Flight DAG visualizer with code diffs and terminal logs | Planned |

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
- Multi-repo teammate mode (Bee monitors multiple repositories)
- Cloud-hosted Bee (managed SaaS deployment)

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

### In progress

- [ ] Git MCP server (`tools/hive-local/git_mcp_server.py`)
- [ ] Sandbox Runner MCP (`tools/hive-local/sandbox_runner_mcp_server.py`)
- [ ] Code Search MCP (`tools/hive-local/code_search_mcp_server.py`)
- [ ] Self-healing feedback loop in `FlightExecutor`
- [ ] Approval Gate system in `bee-core` + Console UI
- [ ] Tauri v2 desktop shell + sidecar management
- [ ] Teammate Board + Mission Control UI enhancements

### Later

- [ ] Implement `packages/sdk` (**@bee/sdk**) — [sdk-cli-roadmap.md](sdk-cli-roadmap.md)
- [ ] Implement `apps/cli` (**bee-cli**) — [sdk-cli-roadmap.md](sdk-cli-roadmap.md)
- [ ] Storybook / Postgres / publish
- [ ] Multi-repo monitoring mode
- [ ] Cloud-hosted managed deployment
