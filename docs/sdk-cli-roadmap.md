# bee-sdk & bee-cli — detailed future roadmap

**Status:** Deferred. Scaffolds remain at [`packages/sdk`](../packages/sdk) and [`apps/cli`](../apps/cli). Do not implement until the Route/Flight HTTP surface and auth have stabilized (post master-plan Phases 0–2).

This document is the end-to-end build plan for when we pick them up.

---

## Goals

| Surface | Audience | Job |
|---|---|---|
| **@bee/sdk** (TypeScript) | App embedders, automation scripts in Node | Typed programmatic access to Bee API |
| **bee-sdk** (Python, optional) | Data / backend embedders | Thin wrapper over Bee API or `bee-core` |
| **bee-cli** | Developers & CI | Terminal UX for chat, Route, Flight, Hive, logs |

Both must speak the **same contracts** as BEE Console (`route_id`, Flight SSE, Bearer auth).

---

## Phase S0 — Contracts freeze (prerequisite)

Before writing SDK/CLI code:

1. Freeze OpenAPI paths:
   - `POST /api/auth/login|signup`, `GET /api/auth/me`
   - `POST /api/agent/route`, `POST /api/agent/flight/{route_id}`, stream endpoint
   - `POST /api/conversations/*`, `GET /api/hive/registry`, logs
2. Keep `pnpm codegen` / `pnpm codegen:check` green
3. Document auth: Bearer token + `access_token` query for SSE
4. Version Bee API at least `0.3.0` when SDK ships

---

## Phase S1 — TypeScript `@bee/sdk`

**Location:** `packages/sdk` (package name `@bee/sdk`)

### Layout

```text
packages/sdk/
  package.json
  src/
    index.ts
    client.ts          # BeeClient
    auth.ts
    routes.ts
    flights.ts
    conversations.ts
    hive.ts
    logs.ts
    errors.ts
  README.md
  examples/
    quick-flight.ts
    conversation.ts
```

### Public API (target)

```ts
import { BeeClient } from "@bee/sdk";

const bee = new BeeClient({
  baseUrl: process.env.BEE_API_URL,
  token: process.env.BEE_TOKEN, // or bee.login(email, password)
});

const route = await bee.routes.create("Summarize open PRs and post to Slack");
for await (const event of bee.flights.stream(route.route_id)) {
  console.log(event);
}
const result = await bee.flights.execute(route.route_id);
```

### Implementation notes

- Depend on `@bee/api-client` for fetch helpers + generated OpenAPI types
- Add `BeeClient` config: `baseUrl`, `token`, `fetch` override, `onUnauthorized`
- Map API errors to `BeeApiError { code, message, status }`
- SSE: wrap `EventSource` / undici stream for Node 18+
- Export subpath `@bee/sdk/node` if browser vs Node EventSource differs
- Unit tests with mocked fetch; one smoke integration test behind env flag

### Packaging

- `private: true` until API freeze
- Later: publish to npm with `0.1.0`, changelog, dual ESM

---

## Phase S2 — `bee-cli`

**Location:** `apps/cli` (binary name `bee`)

### Preferred stack

- TypeScript on Node, consuming `@bee/sdk`
- Ship via `pnpm` workspace package with `bin: { bee: ./dist/cli.js }`
- Alternative (only if TS proves painful for SSE): thin Python Typer CLI calling same HTTP API — still must not import private `bee-core` in the published CLI

### Commands

| Command | Behavior |
|---|---|
| `bee login` | Interactive email/password → store token in `~/.config/bee/credentials.json` |
| `bee logout` | Clear credentials |
| `bee whoami` | `GET /api/auth/me` |
| `bee chat "<prompt>"` | Start conversation or quick `agent/run` |
| `bee route create "<prompt>"` | Create Route; print `route_id` + summary table |
| `bee route show <id>` | Fetch Route JSON |
| `bee flight run <route_id>` | Execute Flight; stream steps to TTY |
| `bee hive list` | Hive Registry table (name, status, tools) |
| `bee logs [--level] [--subsystem]` | Tail or query logs |
| `bee config set api-url <url>` | Persist base URL |

### UX details

- Progress: step lines with Hive server icon/name
- Exit codes: `0` ok, `1` API error, `2` auth, `3` validation
- `--json` flag on all commands for scripting
- CI example: `bee flight run "$ROUTE_ID" --json`

### Implementation order

1. Config + login/logout/whoami
2. `route create` / `route show`
3. `flight run` with SSE
4. `hive list` + `logs`
5. `chat` convenience

---

## Phase S3 — Python `bee-sdk` (optional)

**Location:** `packages/python/bee-sdk` (new) — only if embedders need Python.

- `httpx` async client mirroring `@bee/sdk`
- Do **not** re-export `bee-core` internals as public SDK
- Publish to PyPI later as `bee-sdk`

---

## Phase S4 — Docs & examples

- `docs/sdk-cli-roadmap.md` (this file) → promote sections into `docs/sdk.md` + `docs/cli.md`
- Examples under `examples/sdk/` and `examples/cli/`
- Console “copy as CLI” affordance (Later): show `bee route create '…'` for current prompt

---

## Phase S5 — Release

1. Semver: SDK/CLI track Bee API major.minor
2. GitHub Releases with changelog
3. npm `@bee/sdk`, `@bee/cli` (or single `bee` package)
4. Optional Homebrew / scoop (Later)
5. CI job: build CLI, run `bee whoami` against ephemeral API

---

## Non-goals (for first SDK/CLI ship)

- Local offline LLM planning without API
- Multi-workspace Hive tenancy in CLI
- GUI installer
- Compatibility shims for `plan_id` (hard cutover already done)

---

## Suggested kickoff checklist

- [ ] API version bump + OpenAPI freeze note in ROADMAP
- [ ] Implement `@bee/sdk` BeeClient + auth + routes + flights
- [ ] Examples green against local `just api`
- [ ] Implement `bee` CLI bin on top of SDK
- [ ] Document in `run.md` optional CLI install
- [ ] Add CI matrix job for SDK unit tests
- [ ] Decide publish timing (after multi-user/Hive UX)
