import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from bee_api.core import (
    close_db_pool,
    init_db_pool,
    setup_protected_docs,
)
from bee_api.core.config import settings
from bee_api.domains.admin.routers import router as admin_router
from bee_api.domains.agent.routers import router as agent_router
from bee_api.domains.approvals.routers import router as approvals_router
from bee_api.domains.auth.routers import router as auth_router
from bee_api.domains.billing.routers import router as billing_router
from bee_api.domains.channels.routers import router as channels_router
from bee_api.domains.chat.routers import (
    messages_router as chat_messages_router,
    stream_router as chat_stream_router,
    threads_router as chat_threads_router,
)
from bee_api.domains.conversation.routers import router as conversation_router
from bee_api.domains.credentials.routers import router as credentials_router
from bee_api.domains.health.routers import router as health_router
from bee_api.domains.legal.routers import router as legal_router
from bee_api.domains.mcp.routers import router as mcp_router
from bee_api.domains.memory.routers import router as memory_router
from bee_api.domains.missions.routers import router as missions_router
from bee_api.domains.oauth import oauth_connectors_router
from bee_api.domains.runtimes.routers import router as runtimes_router
from bee_api.domains.security.routers import router as security_router
from bee_api.domains.sync.routers import router as sync_router
from bee_api.domains.telemetry.routers import router as telemetry_router
from bee_api.domains.tenants.routers import router as tenants_router
from bee_api.domains.usage.routers import router as usage_router
from bee_api.domains.users.routers import router as users_router
from bee_api.domains.worker.routers import router as worker_router
from bee_api.domains.workspaces.routers import router as workspaces_router
from bee_api.middleware import (
    add_auth_middleware,
    add_cors_middleware,
    add_global_exception_handler,
    add_rate_limiting_middleware,
    add_request_logging_middleware,
    add_security_headers_middleware,
)
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
add_cors_middleware(app, settings.CORS_ALLOWED_ORIGINS)
add_auth_middleware(app)
add_request_logging_middleware(app)
add_global_exception_handler(app)

# ─── Pure Modular Domain Routers ───
app.include_router(health_router)
app.include_router(legal_router)
app.include_router(credentials_router)
app.include_router(workspaces_router)
app.include_router(conversation_router)
app.include_router(channels_router)
app.include_router(mcp_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tenants_router)
app.include_router(missions_router)
app.include_router(approvals_router)
app.include_router(memory_router)
app.include_router(usage_router)
app.include_router(runtimes_router)
app.include_router(sync_router)
app.include_router(billing_router)
app.include_router(admin_router)
app.include_router(agent_router)
app.include_router(worker_router)
app.include_router(chat_threads_router)
app.include_router(chat_messages_router)
app.include_router(chat_stream_router)
app.include_router(telemetry_router)
app.include_router(security_router)
app.include_router(oauth_connectors_router)

