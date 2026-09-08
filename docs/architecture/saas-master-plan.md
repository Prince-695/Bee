# 🐝 BEE — SaaS & Production Architecture Master Plan

## Core Product Vision

# **BEE — Your Own Personal Co-Engineer**

Bee is evolving from its current local-first architecture into a **production-grade, cloud-connected SaaS platform**.

The fundamental principle is:

> **Do not redesign or replace Bee's existing core intelligence architecture unnecessarily. Productionize, scale, secure, and extend what already exists.**

Bee's existing core architecture remains the foundation:

```text
Signal / Policy
      ↓
Route Planner + DAG Compiler
      ↓
Existing Workers
      ↓
Flight Execution
      ↓
MCP / Hive Tools
      ↓
Self-Healing
      ↓
Guard + Approval Gates
      ↓
Scribe
```

The SaaS infrastructure will be built **around this existing Bee Engine**.

---

# 1. Overall Production Architecture

Bee will evolve into two major connected layers:

```text
                    🐝 BEE PLATFORM
                           │
          ┌────────────────┴────────────────┐
          │                                 │
      ☁️ BEE CLOUD                     💻 BEE RUNTIME
          │                                 │
    APIs / Auth / DB                  Existing Bee Engine
    Memory / Sync                     Local Execution
    Accounts / Usage                  Projects / Terminal
    Remote Services                   Git / Docker
          │                                 │
          └──────── Secure Connection ───────┘
```

## Bee Cloud Responsibilities

The cloud platform will handle:

* Authentication and identity
* User and account management
* Authorization and RBAC
* Production APIs
* Cloud database
* Persistent application state
* Mission synchronization
* Persistent memory
* Usage tracking
* Remote integrations
* Remote/cloud tools
* Billing and subscriptions
* API documentation
* Observability and monitoring

## Bee Runtime Responsibilities

The runtime remains responsible for capabilities requiring access to the user's environment:

* Existing Bee Core
* Local projects
* Filesystem access
* Terminal execution
* Git operations
* Docker
* Local development environments
* Local-only MCP/Hive capabilities

---

# 2. Production Authentication System

Bee will implement a complete native authentication system.

## Authentication Methods

* Email and password signup
* Email and password login
* Google OAuth login
* GitHub OAuth login
* Email verification
* Password reset
* Secure logout
* Session management
* Device/session management

## Token Architecture

```text
Login
  ↓
Access Token
  ↓
Bearer Authentication
  ↓
Protected APIs

Refresh Token
  ↓
Secure Token Rotation
  ↓
New Access Token
```

The system should include:

* Short-lived access tokens
* Secure refresh tokens
* Refresh token rotation
* Token revocation
* Session tracking
* Logout from individual devices
* Logout from all devices
* OAuth account linking where appropriate

---

# 3. Authorization and End-to-End RBAC

Authentication answers:

> **Who is the user?**

Authorization answers:

> **What is the user allowed to access or do?**

Bee will implement a proper authorization layer across all protected resources.

RBAC should eventually control access to:

* Accounts
* Projects
* Repositories
* Missions
* Flights
* Runtimes
* Approvals
* Integrations
* Settings
* Usage
* Billing

## Future Organization Roles

When organizational support is introduced:

* Owner
* Admin
* Member/Developer
* Viewer

The RBAC architecture should be designed correctly from the beginning so it can scale from personal usage to organizational usage.

---

# 4. Personal and Organization Architecture

Bee should support both product models.

```text
Account / Tenant
│
├── 👤 Personal
│     └── Individual user's Bee
│
└── 🏢 Organization
      └── Members + Shared Resources
```

The initial primary experience remains:

# **Bee — Your Own Personal Co-Engineer**

However, the underlying ownership architecture should allow future organization support without rebuilding the entire database or API architecture.

The Bee Engine itself should remain the same. Organizations primarily add:

* Members
* Shared resources
* RBAC
* Shared projects
* Audit controls
* Governance

---

# 5. Database Migration and Cloud Persistence

Bee should move from local SQLite (`bee.db`) as the primary production database.

## Recommended Architecture

```text
Neon PostgreSQL
+
pgvector
```

PostgreSQL becomes the primary source of truth for SaaS data.

## Core Data

The production database should support:

* Users
* Accounts
* Organization memberships
* Sessions
* OAuth accounts
* Projects
* Repositories
* Missions
* Flights
* Execution state
* Approval gates
* Usage
* Integrations
* Settings
* Memory metadata
* Audit events

Local storage can still be used for:

* Runtime cache
* Temporary execution data
* Offline/local state

However, local SQLite should not remain the primary source of truth for the SaaS platform.

---

# 6. Persistent Bee Memory

Bee should gain persistent contextual memory without changing its existing worker architecture.

Memory should support:

## User Context

* Preferences
* Working style
* Bee configuration

## Project Context

* Architecture
* Repository structure
* Important technical context
* Historical decisions

## Mission Context

* Previous missions
* Results
* Failures
* Important outcomes

Architecture:

```text
PostgreSQL
    ↓
Structured Data

pgvector
    ↓
Semantic Retrieval
```

This memory system should enhance the existing Bee intelligence and execution flow rather than introducing a separate architecture.

---

# 7. Bee Runtime Evolution

The existing architecture:

```text
Electron
   ↓
Python / FastAPI Sidecar
   ↓
Existing Bee Core
```

will evolve into a proper production **Bee Runtime**.

```text
Bee Cloud
     ⇅
Secure Connection
     ⇅
Bee Runtime
     ↓
Existing Bee Engine
     ↓
Projects / Tools / Environment
```

The runtime should have:

* Runtime identity
* Secure authentication
* Runtime registration
* Capability reporting
* Heartbeats
* Connection status
* Automatic reconnection
* Secure command dispatch

The existing local execution architecture should be preserved and productionized.

---

# 8. Hybrid MCP / Hive Tool Architecture

Bee should not package every possible tool into every desktop installation.

Instead, tools should be classified into:

```text
☁️ CLOUD TOOLS
💻 LOCAL TOOLS
🔄 HYBRID TOOLS
```

## Cloud Tools

Tools that do not require access to the user's local machine can run centrally.

Examples:

* Search services
* Documentation services
* External APIs
* Cloud integrations
* Git provider APIs
* CI/CD APIs
* Other remotely accessible services

## Local Tools

Tools requiring direct access to the user's environment remain inside the Bee Runtime.

Examples:

* Filesystem
* Local repositories
* Terminal
* Docker
* Local applications
* Local development environments

## Main Goal

> **Keep the Bee Desktop/Runtime lightweight and avoid unnecessarily packaging every tool on every user's machine.**

---

# 9. Tool Routing

Bee's existing policy and routing architecture should determine where a tool executes.

```text
Mission
   ↓
Bee Policy / Routing
   ↓
Does the task require local access?
        │
    ┌───┴───┐
   YES      NO
    │        │
 Local     Cloud
Runtime    Service
```

This allows Bee to intelligently use cloud capabilities while preserving local execution where necessary.

---

# 10. Durable Missions and Flights

Bee's missions and execution flow should become production-grade and durable.

Missions should survive:

* Application restart
* Runtime restart
* Backend restart
* Temporary network failure
* Interrupted execution

Architecture:

```text
Mission
   ↓
Persisted State
   ↓
DAG / Flights
   ↓
Checkpoint
   ↓
Execution Events
   ↓
Resume / Recover
```

Add:

* Mission persistence
* Flight persistence
* Execution checkpoints
* Retry mechanisms
* Recovery mechanisms
* Failure tracking
* Execution history

---

# 11. Security, Guard, and Approval System

Bee's existing Guard and approval architecture should be expanded into production-grade security infrastructure.

```text
Bee proposes action
        ↓
Guard checks policy
        ↓
Approval required?
        ↓
User approves / rejects
        ↓
Bee executes
```

Approval can be required for sensitive operations such as:

* Dangerous commands
* File deletion
* Git pushes
* Deployments
* Sensitive integrations
* High-impact system actions

Additional production security includes:

* Secret redaction
* Audit logging
* Security event tracking
* Execution logs
* Authorization checks
* Runtime authentication

---

# 12. Production API Platform

Bee should have a complete, versioned API platform.

Example structure:

```text
/api/v1/auth
/api/v1/users
/api/v1/accounts
/api/v1/projects
/api/v1/repositories
/api/v1/missions
/api/v1/flights
/api/v1/runtimes
/api/v1/approvals
/api/v1/memory
/api/v1/integrations
/api/v1/usage
```

## Authentication APIs

* Signup
* Login
* Logout
* Refresh token
* Password reset
* Email verification
* Google OAuth
* GitHub OAuth
* Session management

## User APIs

* Profile
* Preferences
* Settings

## Bee APIs

* Projects
* Repositories
* Missions
* Mission status
* Flights
* Execution history
* Approvals

## Runtime APIs

* Runtime registration
* Runtime authentication
* Heartbeats
* Runtime status
* Runtime capabilities
* Secure command dispatch

## SaaS APIs

* Usage
* Plans
* Feature entitlements
* Subscriptions
* Billing

---

# 13. OpenAPI and Swagger Documentation

Every production API should have complete documentation.

```text
OpenAPI Specification
        ↓
Swagger UI
        ↓
Production API Documentation
```

Each endpoint should document:

* Endpoint path
* HTTP method
* Authentication requirements
* Bearer token requirements
* Required permissions
* Request schema
* Response schema
* Error responses
* Example requests
* Example responses

The objective is:

> **Bee's API ecosystem should feel like a real production developer platform.**

---

# 14. Real-Time Communication

Bee's execution events should be productionized for real-time communication.

Real-time updates should include:

* Mission progress
* Flight status
* Worker activity
* Approval requests
* Runtime status
* Execution logs

Architecture:

```text
Bee Runtime
      ⇅
Bee Cloud
      ⇅
Desktop / Web UI
```

Possible technologies:

* SSE for streaming execution events
* WebSockets for bidirectional real-time communication where required

---

# 15. Observability and Monitoring

A production autonomous engineering system requires complete observability.

## System Monitoring

Track:

* API errors
* Latency
* Service failures
* Runtime health

## Bee Execution Monitoring

Track:

* Mission duration
* Flight duration
* Worker failures
* Retries
* Recovery events
* Tool execution

## Usage Monitoring

Track:

* Model usage
* Token usage
* Tool usage
* Execution time

## Security Monitoring

Track:

* Authentication events
* Authorization failures
* Sensitive actions
* Approval history
* Security events

---

# 16. SaaS and Billing Infrastructure

Once the core product is stable, introduce:

* Free plans
* Paid plans
* Usage limits
* Feature entitlements
* Model/token usage tracking
* Runtime limits
* Subscription management
* Billing

The billing system should integrate directly with the account and authorization architecture.

---

# 17. Product Experience

## Bee Desktop

The execution-focused environment.

```text
Bee Desktop
      ↓
Bee Runtime
      ↓
Your Projects
```

## Bee Web

The cloud control center.

The web experience can provide:

* Dashboard
* Projects
* Missions
* Execution history
* Runtime monitoring
* Usage
* Account settings
* API documentation
* Billing

The long-term goal is to allow users to securely observe and manage Bee across their devices.

---

# Implementation Roadmap

## Phase 1 — SaaS Foundation

* Review and preserve existing Bee architecture
* Finalize SaaS architecture
* Design database schema
* Design ownership/account model
* Configure Neon PostgreSQL
* Plan migration from `bee.db`

---

## Phase 2 — Identity and Security

* Native authentication
* Password security
* JWT access tokens
* Refresh tokens
* Token rotation
* Bearer authentication
* Google OAuth
* GitHub OAuth
* Session management
* RBAC foundation

---

## Phase 3 — Production API Platform

* Versioned APIs
* Request/response schemas
* Authorization middleware
* Error handling
* OpenAPI
* Swagger UI
* API documentation
* API testing

---

## Phase 4 — Cloud Persistence

Move important Bee state into PostgreSQL:

* Users/accounts
* Projects
* Missions
* Flights
* Approval gates
* Usage
* Execution history

Make execution durable and recoverable.

---

## Phase 5 — Bee Cloud ↔ Runtime

Productionize the existing Electron + FastAPI architecture.

Add:

* Runtime registration
* Runtime identity
* Secure authentication
* Heartbeats
* Runtime status
* Reconnection
* Secure cloud communication

---

## Phase 6 — Hybrid MCP / Hive Infrastructure

Review every existing Bee tool and classify it as:

```text
LOCAL
CLOUD
HYBRID
```

Move appropriate capabilities to cloud infrastructure while keeping local-only capabilities inside the runtime.

---

## Phase 7 — Persistent Memory

Implement:

* User context
* Project context
* Repository knowledge
* Mission history
* Semantic retrieval

Using PostgreSQL + pgvector.

---

## Phase 8 — Production Reliability

Implement:

* Checkpoints
* Recovery
* Retries
* Mission resume
* Runtime reconnection
* Failure handling
* Observability

---

## Phase 9 — Complete SaaS Experience

Build:

* Cloud dashboard
* Mission history
* Runtime monitoring
* Usage tracking
* Account settings
* Plans
* Billing

---

## Phase 10 — Organization Product

After Bee Personal is mature, expand to:

* Organization accounts
* Members
* Shared resources
* Advanced RBAC
* Shared projects
* Audit controls
* Organization governance

---

# Final Architectural Direction

```text
                       🐝 BEE

             YOUR OWN PERSONAL CO-ENGINEER
                         │
              ┌──────────┴──────────┐
              │                     │
         ☁️ BEE CLOUD          💻 BEE RUNTIME
              │                     │
       Auth + APIs + DB       Existing Bee Core
       Memory + SaaS          DAG + Workers
       Remote Services        Local Execution
              │                     │
              └──────── Secure ─────┘
                         │
                    YOUR PROJECTS
```

# Core Principle

> **We are not replacing Bee.**

We are transforming the existing Bee architecture into a:

* Secure
* Scalable
* Cloud-connected
* Production-grade
* Multi-account capable
* API-driven
* Fully documented
* Observable
* Reliable SaaS platform

while preserving the existing Bee intelligence, workers, orchestration, execution, and core architectural philosophy.

---

# Immediate Next Step

Before implementation begins:

1. Review the current repository against this roadmap.
2. Identify what is already implemented.
3. Identify architectural gaps.
4. Create a migration and implementation sequence.
5. Implement changes incrementally without breaking the existing Bee Core.

> **The goal is to evolve Bee into production — not rebuild Bee from scratch.**
