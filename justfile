# Bee monorepo task runner
# Install: https://github.com/casey/just

set shell := ["bash", "-cu"]

venv := ".venv/bin/activate"

dev:
  @echo "Start API and Console in two terminals — see run.md"
  @echo "  just api"
  @echo "  just console"

api:
  source {{venv}} && cd apps/api && uvicorn bee_api.main:app --reload --host 0.0.0.0 --port 8000

console:
  pnpm --filter @bee/console dev

test:
  source {{venv}} && python -m unittest discover -s apps/api/tests -t .

worker:
  source {{venv}} && bee-worker --poll 2

lint:
  pnpm lint

codegen:
  pnpm codegen

docker-up:
  docker compose -f infra/compose/docker-compose.yml up --build
