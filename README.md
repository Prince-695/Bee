# 🐝 Bee — Autonomous AI Co-Engineer Platform

> *"You write the code. Bee owns the aftermath."*

Bee is an event-triggered autonomous AI engineering platform that wakes up on real-world engineering signals (PRs, CI failures, issue alerts), executes multi-stage missions via Directed Acyclic Graph (DAG) workflows across developer tools, runs tests in isolated sandboxes, self-heals broken code with compiler feedback, scrubs secrets automatically, and enforces Zero-Trust human authorization gates on mobile devices.

---

## 🏛️ Monorepo Architecture

The repository is structured as a polyglot monorepo:

| Directory | Subsystem / Package | Technology | Role |
| :--- | :--- | :--- | :--- |
| [`apps/api`](apps/api) | **Bee API** | FastAPI, Python 3.11, Pydantic v2 | Standardized `/v1` modular platform gateway, protected Swagger UI, and encrypted credentials vault |
| [`apps/console`](apps/console) | **Bee Desktop Console** | Electron, React 19, TypeScript, Vite | Desktop developer cockpit, attention center, and mission DAG control |
| [`apps/web`](apps/web) | **Bee Showcase & Docs** | React 19, TypeScript, Vite | Public marketing website, product documentation, and legal portal |
| [`apps/worker`](apps/worker) | **Flight Worker** | Python 3.11 | Dedicated background process for durable task queue polling |
| [`apps/cli`](apps/cli) | **Bee CLI** | Node.js / TypeScript | Lightweight developer terminal client (scaffold) |
| [`packages/python/bee-core`](packages/python/bee-core) | **Bee Core Engine** | Python 3.11 | Autonomous DAG planner, self-healing Flight executor loop, and DB stores |
| [`packages/python/bee-hive`](packages/python/bee-hive) | **Bee Hive Registry** | Python 3.11 | FastMCP server registry, tool discovery, and dynamic MCP loader |
| [`packages/python/bee-logging`](packages/python/bee-logging) | **Bee Logging** | Python 3.11 | High-throughput structured JSONL audit logger and real-time SSE streamer |
| [`packages/ui`](packages/ui) | **@bee/ui** | React 19, Tailwind CSS | Shared design tokens, primitives, and accessible component library |
| [`packages/api-client`](packages/api-client) | **@bee/api-client** | TypeScript | Type-safe OpenAPI client generated from the FastAPI backend schema |
| [`packages/sdk`](packages/sdk) | **@bee/sdk** | TypeScript | Programmatic SDK for custom integrations (scaffold) |
| [`tools/hive-local`](tools/hive-local) | **Local FastMCP Servers** | Python 3.11 | Native tool servers: Git operations, Sandbox test execution, Ripgrep code search, etc. |
| [`infra/`](infra/) | **Infrastructure as Code** | Docker, Docker Compose | Multi-stage Dockerfiles and compose stacks for Postgres+pgvector, Redis, and API |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **pnpm 9+** (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker & Docker Compose** (optional, for containerized execution)

### 1. Backend Python Setup

From the repository root:

```bash
# 1. Create and activate Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# 2. Upgrade pip and install editable monorepo packages
pip install --upgrade pip
pip install -e packages/python/bee-logging
pip install -e packages/python/bee-hive
pip install -e packages/python/bee-core
pip install -e apps/api
```

### 2. Frontend Node Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the canonical environment template and configure your keys:

```bash
cp .env.example .env
```

*Key configuration variables to review in `.env`:*
- `SWAGGER_USERNAME` & `SWAGGER_PASSWORD`: Credentials for protected `/docs` and `/redoc`.
- `JWT_SECRET`: 32+ character hex string for signing access and refresh tokens.
- `VAULT_ENCRYPTION_KEY`: 32-character hex key for encrypting credentials at rest.
- `LLM_API_KEY`: API key for Gemini or OpenAI.

### 4. Running the Development Servers

Using [just](https://github.com/casey/just) or direct shell commands:

```bash
# Terminal 1: Start FastAPI Backend (port 8000)
source .venv/bin/activate
cd apps/api
uvicorn bee_api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Desktop Console
pnpm --filter @bee/console dev

# Terminal 3 (Optional): Start Durable Flight Worker
source .venv/bin/activate
bee-worker --poll 2.0
```

- **Interactive API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Protected with HTTP Basic Auth)
- **Health Probes**: [http://localhost:8000/health/live](http://localhost:8000/health/live) and `/health/ready`
- **Desktop Console**: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Deployment

To launch the full production-ready stack (PostgreSQL with pgvector, Redis, and the hardened FastAPI API container):

```bash
docker compose -f infra/compose/docker-compose.yml up --build
```

---

## 🧪 Running Automated Tests

Run the full backend test suite:

```bash
source .venv/bin/activate
pytest apps/api/tests/ -v
```

---

## 📚 Documentation & Architecture

- **Terminology & Concepts**: [docs/terminology.md](docs/terminology.md)
- **System Architecture & Design**: [docs/architecture/README.md](docs/architecture/README.md)
- **SaaS Master Plan & Tenancy**: [docs/architecture/saas-master-plan.md](docs/architecture/saas-master-plan.md)
- **Product Roadmap**: [docs/ROADMAP.md](docs/ROADMAP.md)
