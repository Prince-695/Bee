"""Protected Swagger UI, ReDoc, and OpenAPI Schema Configuration.

Enforces HTTP Basic Auth on documentation and configures dynamic server toggles.
"""

from __future__ import annotations

import secrets
from typing import Any, Dict
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import JSONResponse

from bee_api.core.config import settings

_security_basic = HTTPBasic()


def validate_swagger_credentials(
    credentials: HTTPBasicCredentials = Depends(_security_basic),
) -> str:
    """Validates HTTP Basic Auth credentials for accessing Swagger UI and OpenAPI docs."""
    correct_username = secrets.compare_digest(credentials.username, settings.SWAGGER_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, settings.SWAGGER_PASSWORD)

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Swagger username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


def custom_openapi(app: FastAPI) -> Dict[str, Any]:
    """Generates customized OpenAPI 3.1 schema with HTTP/HTTPS toggles and Bearer security."""
    if app.openapi_schema:
        return app.openapi_schema

    servers = [
        {"url": f"http://localhost:{settings.PORT}", "description": "Local Development (HTTP)"},
        {"url": "https://api.bee.dev", "description": "Production Cloud Platform (HTTPS)"},
    ]

    openapi_schema = get_openapi(
        title="🐝 Bee — Autonomous AI Co-Engineer Platform",
        version="1.0.0",
        description="""
# 🐝 Bee Platform API

Bee is an **Autonomous AI Co-Engineer platform** powered by a 5-worker agent fleet:
- **Scout**: Codebase AST indexing and semantic navigation
- **Planner**: Multi-step DAG route synthesis
- **Tester**: Automated regression testing and failure isolation
- **Fixer**: Compiler/test feedback self-healing code synthesis
- **Scribe**: Structured audit trails, changelogs, and pull requests

### Authentication
All non-public endpoints require Bearer JWT authentication:
- Click the **Authorize** button and enter your JWT access token.
- Format: `Bearer <access_token>`
        """,
        routes=app.routes,
        servers=servers,
    )

    # Configure Bearer Security Scheme in components
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token as: Bearer <access_token>",
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


def setup_protected_docs(app: FastAPI) -> None:
    """Mounts authenticated /docs, /redoc, and /openapi.json routes."""

    @app.get("/docs", include_in_schema=False)
    async def get_swagger_documentation(
        _: str = Depends(validate_swagger_credentials),
    ):
        return get_swagger_ui_html(
            openapi_url="/openapi.json",
            title="Bee API — Swagger Documentation",
            swagger_favicon_url="/static/logo.png",
            oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        )

    @app.get("/redoc", include_in_schema=False)
    async def get_redoc_documentation(
        _: str = Depends(validate_swagger_credentials),
    ):
        return get_redoc_html(
            openapi_url="/openapi.json",
            title="Bee API — ReDoc",
            redoc_favicon_url="/static/logo.png",
        )

    @app.get("/openapi.json", include_in_schema=False)
    async def get_open_api_endpoint(
        _: str = Depends(validate_swagger_credentials),
    ):
        return JSONResponse(custom_openapi(app))
