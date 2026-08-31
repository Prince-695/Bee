# 🐝 Bee Architecture & System Design Document

> **Version:** 1.0.0 (Production-Ready)  
> **Platform:** Bee Autonomous AI Co-Engineer (Personal Desktop & Multi-Tenant SaaS)  
> **Repository:** [https://github.com/Prince-695/Bee](https://github.com/Prince-695/Bee)  
> **Architecture Pattern:** Monorepo with Domain-Driven / Feature-Sliced Architecture

---

## 1. Executive Summary & Core Philosophy

**Bee** is a production-grade, event-triggered autonomous AI co-engineer platform designed for engineering teams and non-coding developers. Unlike traditional autocomplete code assistants, Bee acts as an active engineering teammate that executes multi-step Directed Acyclic Graph (DAG) workflows across developer tools, runs tests in isolated sandboxes, self-heals broken code with compiler feedback, scrubs secrets automatically, and enforces Zero-Trust human authorization gates on mobile devices.

### Dual Topology Execution Model
1. **👤 Bee Personal**: Local-first execution for solo developers, students, and open-source hackers using local SQLite (`bee.db`), direct local filesystem/terminal access, and 1-click OAuth connectors.
2. **🏢 Bee Multi-Tenant SaaS**: Cloud-connected architecture with Tenant Isolation (`personal` vs `organization`), Neon PostgreSQL + `pgvector`, native JWT token rotation, and RBAC (`Owner`, `Admin`, `Member`, `Viewer`).

---

## 2. Monorepo Directory Breakdown

```
bee/
├── apps/
│   ├── api/                                  # [FastAPI Backend & Standardized /v1 Platform]
│   │   ├── src/bee_api/
│   │   │   ├── auth/                         # Production Auth: JWT, bcrypt, OTP, dependencies, RBAC
│   │   │   │   ├── dependencies.py           # get_current_user, get_current_tenant, require_role
│   │   │   │   ├── email_service.py          # SMTP & Mock OTP Dispatcher
│   │   │   │   └── security.py               # Token rotation & password hashing
│   │   │   ├── routers/
│   │   │   │   └── v1/                       # Standardized /v1/* Platform Routers
│   │   │   │       ├── router_auth.py        # 12 /v1/auth/* endpoints (Signup, Login, OTP, Reset, OAuth)
│   │   │   │       ├── router_users.py       # /v1/users/me (Profiles & Settings)
│   │   │   │       ├── router_tenants.py     # /v1/tenants/* (Multi-Tenancy & RBAC Memberships)
│   │   │   │       ├── router_missions.py    # /v1/missions/* (5-Worker DAG & Real-time SSE)
│   │   │   │       ├── router_approvals.py   # /v1/approvals/* (Zero-Trust Human Gates)
│   │   │   │       ├── router_memory.py      # /v1/memory/* (Semantic Search & Remediation Recall)
│   │   │   │       ├── router_usage.py       # /v1/usage/* (Token Budget & USD Spend Meters)
│   │   │   │       └── router_runtimes.py    # /v1/runtimes/* (Cloud ↔ Desktop Runtime Pairing)
│   │   │   ├── config.py                     # Environment settings
│   │   │   └── main.py                       # FastAPI application entrypoint & lifespan
│   │   ├── tests/                            # 32/32 Passing Backend Unit & E2E Tests
│   │   └── pyproject.toml                    # bee-api package configuration
│   │
│   ├── console/                              # [Desktop Electron & Mission Control]
│   │   ├── electron/
│   │   │   ├── main.cjs                      # Electron window management & system tray
│   │   │   ├── preload.cjs                   # Secure contextBridge API for IPC
│   │   │   └── sidecar.cjs                   # FastMCP Python backend process supervisor
│   │   ├── src/
│   │   │   ├── features/                     # Feature-Sliced Domain Modules
│   │   │   │   ├── status/                   # Teammate Board & Attention Center
│   │   │   │   ├── mission-control/          # Multi-Worker DAG & Streaming Terminal
│   │   │   │   ├── conversation/             # Co-Engineer Chat Workspace
│   │   │   │   ├── hive-registry/            # MCP Tools, 1-Click Connectors & BYOK
│   │   │   │   ├── signal-engine/            # Webhook Ingestion & Simulator
│   │   │   │   └── flight-logs/              # Token Budget & Secret Redactor
│   │   │   ├── layout/                       # DesktopHeader, DesktopSidebar, DesktopLayout
│   │   │   ├── App.tsx                       # Desktop Router (Boots directly to Teammate Board)
│   │   │   └── index.css                     # OLED Dark Theme CSS Tokens
│   │   └── package.json                      # @bee/console
│   │
│   └── web/                                  # [Public Marketing & Documentation Platform]
│       ├── src/
│       │   ├── features/
│       │   │   ├── landing/                  # HeroSection, InteractiveFlightDemo, WorkerArchitecture,
│       │   │   │                             # RoiCalculator, PricingSection, FaqSection, LandingPage.tsx
│       │   │   ├── docs/                     # DocsPage, DocsSidebar, docsData.ts
│       │   │   └── auth/                     # LoginPage, SignUpPage
│       │   ├── layout/                       # WebNavbar, WebFooter
│       │   ├── lib/                          # downloads.ts (OS auto-detection & direct download)
│       │   ├── App.tsx                       # Web Router (/, /docs, /login, /signup)
│       │   └── index.css                     # Web styles & CSS Tokens
│       └── package.json                      # @bee/web
│
├── packages/
│   ├── api-client/                           # Auto-Generated TypeScript OpenAPI Client
│   ├── ui/                                   # Shared Base UI Headless Primitives & Design System
│   └── python/
│       ├── bee-core/                         # Brain: DB Adapter, Memory Engine, DAG, Security
│       │   ├── db/                           # Universal DatabaseEngine (Postgres + SQLite)
│       │   ├── memory/                       # AgenticMemoryEngine (pgvector RAG & Recall)
│       │   ├── mission/                      # MissionStore, MissionOrchestrator
│       │   ├── security/                     # SecretRedactor, BudgetEngine
│       │   └── stores/                       # gate_store, oauth_store, chat_store
│       ├── bee-hive/                         # MCP Tool Registry & Client Dispatcher
│       └── bee-logging/                      # Structured JSON-lines logger
│
├── tools/
│   └── hive-local/                           # Native FastMCP Servers (Git, Sandbox, Search, Gmail, Jira)
│
├── pnpm-workspace.yaml
├── turbo.json
└── .github/workflows/ci.yml
```

---

## 3. The 12 Production `/v1/auth/*` Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/v1/auth/signup` | Register new user account with email, password, and name + auto-create personal tenant |
| **POST** | `/v1/auth/login` | Authenticate with email and password to receive access & refresh tokens |
| **POST** | `/v1/auth/logout` | Invalidate current session and revoke refresh tokens |
| **POST** | `/v1/auth/refresh` | Rotate refresh token and issue a new access token |
| **GET** | `/v1/auth/me` | Fetch the currently authenticated user's profile and active tenant memberships |
| **POST** | `/v1/auth/otp/send` | Generate and send a 6-digit email verification OTP via SMTP |
| **POST** | `/v1/auth/otp/verify` | Verify the 6-digit OTP code to mark the account as verified (`is_verified = true`) |
| **POST** | `/v1/auth/forgot-password`| Request a 6-digit password reset OTP sent to the user's email |
| **POST** | `/v1/auth/reset-password` | Reset password using the received 6-digit OTP and new password |
| **POST** | `/v1/auth/change-password`| Change password with current and new password while logged in |
| **GET** | `/v1/auth/{provider}/login` | Initiate OAuth login flow (`google` or `github`) |
| **GET** | `/v1/auth/{provider}/callback` | Handle OAuth redirect callback, auto-link account, and auto-verify email |

---

## 4. Quality Assurance & Verification Standards

| Verification Suite | Target | Status | Passing Metrics |
| :--- | :--- | :---: | :--- |
| **Backend Pytest Suite** | `apps/api/tests/` | ✅ PASS | **32/32 tests passed (100%)** |
| **ESLint Validation** | `@bee/console` + `@bee/web` | ✅ PASS | **0 errors, 0 warnings** |
| **TypeScript Typecheck** | All workspace packages | ✅ PASS | **0 errors (Strict mode)** |
| **Web Showcase Build** | `apps/web` | ✅ PASS | **Compiled in 1.54s** |
| **Desktop Console Build** | `apps/console` | ✅ PASS | **Compiled in 3.85s** |
| **CI Automation** | GitHub Actions (`ci.yml`) | ✅ PASS | **Dual-app parallel test & build pipeline** |
