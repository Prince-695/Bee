import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from bee_api.config import CORS_ALLOWED_ORIGINS, MCP_SERVERS
from bee_api.core import (
    close_db_pool,
    init_db_pool,
    setup_protected_docs,
)
from bee_api.domains.credentials.routers import router as credentials_router
from bee_api.domains.health.routers import router as health_probes_router
from bee_api.domains.legal.routers import router as legal_router
from bee_api.domains.workspaces.routers import router as workspaces_router
from bee_api.domains.conversation.routers import router as conversation_domain_router
from bee_api.domains.channels.routers import router as channels_router
from bee_api.domains.mcp.routers import router as mcp_router
from bee_api.middleware import (
    add_auth_middleware,
    add_cors_middleware,
    add_global_exception_handler,
    add_rate_limiting_middleware,
    add_request_logging_middleware,
    add_security_headers_middleware,
)
from bee_api.routers.router_agent import router as agent_router
from bee_api.routers.router_auth import router as auth_router
from bee_api.routers.router_conversation import router as conversation_router
from bee_api.routers.router_health import router as legacy_health_router
from bee_api.routers.router_logs import router as logs_router
from bee_api.routers.router_missions import router as missions_router
from bee_api.routers.router_oauth import router as oauth_router
from bee_api.routers.router_security import router as security_router
from bee_api.routers.router_webhooks import router as webhooks_router
from bee_api.routers.router_whatsapp import router as whatsapp_router
from bee_api.routers.v1.router_admin import router as v1_admin_router
from bee_api.domains.approvals.routers import router as v1_approvals_router
from bee_api.domains.auth.routers import router as v1_auth_router
from bee_api.routers.v1.router_billing import router as v1_billing_router
from bee_api.routers.v1.router_memory import router as v1_memory_router
from bee_api.domains.missions.routers import router as v1_missions_router
from bee_api.routers.v1.router_runtimes import router as v1_runtimes_router
from bee_api.routers.v1.router_sync import router as v1_sync_router
from bee_api.domains.tenants.routers import router as v1_tenants_router
from bee_api.routers.v1.router_usage import router as v1_usage_router
from bee_api.routers.v1.router_users import router as v1_users_router
from bee_core.db.connection import get_db_engine
from bee_core.executor.agent_runtime import pre_initialize_runtime, shutdown_runtime
from bee_core.stores.chat_store import init_db
from bee_core.stores.conversation_store import init_db as init_conversation_db
from bee_core.stores.flight_queue_store import init_flight_queue_db
from bee_core.stores.user_store import init_user_db
from bee_logging import write_log


@asynccontextmanager
async def lifespan(_: FastAPI):
    await write_log("INFO", "gateway", "application_startup")
    await init_db_pool()
    await get_db_engine().init_db()
    init_db()
    init_conversation_db()
    init_user_db()
    init_flight_queue_db()
    print("\nBee API starting...")
    print(f"  Hive servers configured: {len(MCP_SERVERS)}")
    print("  Loading Hive workers (this may take a moment)...\n")

    asyncio.create_task(pre_initialize_runtime())

    try:
        yield
    finally:
        try:
            await shutdown_runtime()
        except Exception:
            pass
        await close_db_pool()
        await write_log("INFO", "gateway", "application_shutdown")
        print("\nBee API stopped.")


app = FastAPI(
    title="Bee API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

setup_protected_docs(app)

add_security_headers_middleware(app)
add_rate_limiting_middleware(app)
add_cors_middleware(app, CORS_ALLOWED_ORIGINS)
add_auth_middleware(app)
add_request_logging_middleware(app)
add_global_exception_handler(app)

# ─── New Modular Domain Routers ───
app.include_router(health_probes_router)
app.include_router(legal_router)
app.include_router(credentials_router)
app.include_router(workspaces_router)
app.include_router(conversation_domain_router)
app.include_router(channels_router)
app.include_router(mcp_router)

# ─── V1 Standardized Platform Routers ───
app.include_router(v1_auth_router)
app.include_router(v1_users_router)
app.include_router(v1_tenants_router)
app.include_router(v1_missions_router)
app.include_router(v1_approvals_router)
app.include_router(v1_memory_router)
app.include_router(v1_usage_router)
app.include_router(v1_runtimes_router)
app.include_router(v1_sync_router)
app.include_router(v1_billing_router)
app.include_router(v1_admin_router)

# ─── Backward-Compatible Legacy Routers ───
app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(conversation_router)
app.include_router(legacy_health_router)
app.include_router(logs_router)
app.include_router(missions_router)
app.include_router(oauth_router)
app.include_router(security_router)
app.include_router(webhooks_router)
app.include_router(whatsapp_router)
