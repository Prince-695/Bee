import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from bee_api.config import CORS_ALLOWED_ORIGINS, MCP_SERVERS
from bee_api.middleware import (
    add_auth_middleware,
    add_cors_middleware,
    add_global_exception_handler,
    add_request_logging_middleware,
)
from bee_api.routers.router_agent import router as agent_router
from bee_api.routers.router_auth import router as auth_router
from bee_api.routers.router_conversation import router as conversation_router
from bee_api.routers.router_health import router as health_router
from bee_api.routers.router_logs import router as logs_router
from bee_api.routers.router_missions import router as missions_router
from bee_api.routers.router_oauth import router as oauth_router
from bee_api.routers.router_security import router as security_router
from bee_api.routers.router_webhooks import router as webhooks_router
from bee_api.routers.router_whatsapp import router as whatsapp_router
from bee_api.routers.v1.router_auth import router as v1_auth_router
from bee_api.routers.v1.router_users import router as v1_users_router
from bee_api.routers.v1.router_tenants import router as v1_tenants_router
from bee_api.routers.v1.router_missions import router as v1_missions_router
from bee_api.routers.v1.router_approvals import router as v1_approvals_router
from bee_api.routers.v1.router_memory import router as v1_memory_router
from bee_api.routers.v1.router_usage import router as v1_usage_router
from bee_api.routers.v1.router_runtimes import router as v1_runtimes_router
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
        await shutdown_runtime()
        await write_log("INFO", "gateway", "application_shutdown")
        print("\nBee API stopped.")


app = FastAPI(title="Bee API", version="1.0.0", lifespan=lifespan)

add_cors_middleware(app, CORS_ALLOWED_ORIGINS)
add_auth_middleware(app)
add_request_logging_middleware(app)
add_global_exception_handler(app)

# ─── V1 Standardized Platform Routers ───
app.include_router(v1_auth_router)
app.include_router(v1_users_router)
app.include_router(v1_tenants_router)
app.include_router(v1_missions_router)
app.include_router(v1_approvals_router)
app.include_router(v1_memory_router)
app.include_router(v1_usage_router)
app.include_router(v1_runtimes_router)

# ─── Backward-Compatible Legacy Routers ───
app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(conversation_router)
app.include_router(health_router)
app.include_router(logs_router)
app.include_router(missions_router)
app.include_router(oauth_router)
app.include_router(security_router)
app.include_router(webhooks_router)
app.include_router(whatsapp_router)
