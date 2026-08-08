# Run Bee locally

Do not start services until setup below is done.

## Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm (`corepack enable && corepack prepare pnpm@9 --activate`)

## 1) Python venv (repo root)

A root `.venv` may already exist. If not, create it:

```bash
cd /home/princerathod695/Projects/bee

python3.11 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -e packages/python/bee-logging
pip install -e packages/python/bee-hive
pip install -e packages/python/bee-core
pip install -e apps/api
```

If `.venv` already exists, activate it and re-run the `pip install -e ...` lines after pulling changes.

## 2) Environment

```bash
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env — set at least LLM_API_KEY (or NVIDIA_API_KEY)
# optionally: TOKEN_ENCRYPTION_KEY
```

Generate an encryption key:

```bash
source .venv/bin/activate
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## 3) Console dependencies

```bash
cd /home/princerathod695/Projects/bee
pnpm install
```

## 4) Start Bee API (terminal 1)

```bash
cd /home/princerathod695/Projects/bee
source .venv/bin/activate
cd apps/api
uvicorn bee_api.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/api/health
- Docs: http://localhost:8000/docs

Or from repo root with [just](https://github.com/casey/just): `just api`

## 5) Start BEE Console (terminal 2)

```bash
cd /home/princerathod695/Projects/bee
pnpm --filter @bee/console dev
```

- App: http://localhost:5173

Or: `just console`

## Optional: OpenAPI client codegen

With the venv active and packages installed:

```bash
pnpm codegen
```

Drift check (CI): `pnpm codegen:check`

## Optional: Docker

```bash
# ensure apps/api/.env exists
docker compose -f infra/compose/docker-compose.yml up --build
```

## 6) Optional: Flight worker (terminal 3)

For durable deferred Flights (webhook-ready tasks claimed off-API):

```bash
cd /home/princerathod695/Projects/bee
source .venv/bin/activate
pip install -e apps/worker
just worker
# or: bee-worker --poll 2
```

Without the worker, the API still processes resumed deferred tasks in-process when it can claim them.

## Auth

Sign up / log in via BEE Console (`/signup`, `/login`). API routes (except health, auth, webhooks, docs) require `Authorization: Bearer <token>`. SSE Flight streams accept `?access_token=`.

## Tests

```bash
source .venv/bin/activate
python -m unittest discover -s apps/api/tests -t .
```

If you change API routes, regenerate the client: `pnpm codegen`.
