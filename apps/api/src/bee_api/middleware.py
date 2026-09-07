import time
from collections import defaultdict
from collections.abc import Sequence
from typing import Dict, List, Tuple

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from bee_api.auth import is_public_path, resolve_request_user
from bee_api.response_helpers import error_response
from bee_logging import write_log

# In-memory sliding window rate limiter stores: key -> list of timestamps (float)
_RATE_LIMIT_STORE: Dict[str, List[float]] = defaultdict(list)

# Rate limit configuration (window_seconds, max_requests)
AUTH_RATE_LIMIT: Tuple[int, int] = (60, 5)     # 5 req / min for sensitive auth
GENERAL_RATE_LIMIT: Tuple[int, int] = (60, 120)  # 120 req / min for general API

SENSITIVE_AUTH_PATHS = {
    "/v1/auth/login",
    "/v1/auth/register",
    "/v1/auth/forgot-password",
    "/v1/auth/reset-password",
    "/api/auth/login",
    "/api/auth/signup",
}


def add_security_headers_middleware(app: FastAPI) -> None:
    """Inject strict security headers across all responses."""
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)

        # Content Security Policy (allows necessary scripts/styles for UI while forbidding inline execution abuses)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http://localhost:* ws://localhost:* https:; "
            "frame-ancestors 'none'; "
            "object-src 'none';"
        )
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Force HTTPS (1 year + subdomains)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        # Restrict referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Restrict browser feature permissions
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        # Legacy XSS protection for older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Suppress framework fingerprinting
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]

        return response


def add_rate_limiting_middleware(app: FastAPI) -> None:
    """Enforce sliding-window rate limiting for auth and API endpoints."""
    @app.middleware("http")
    async def rate_limiting_middleware(request: Request, call_next):
        path = request.url.path
        if request.method == "OPTIONS" or path == "/api/health":
            return await call_next(request)

        # Identify client by IP (or forward header)
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        now = time.monotonic()

        # Determine rate limit bucket
        if any(path == p or path.startswith(p) for p in SENSITIVE_AUTH_PATHS):
            window_sec, max_req = AUTH_RATE_LIMIT
            bucket_key = f"auth:{client_ip}:{path}"
        else:
            window_sec, max_req = GENERAL_RATE_LIMIT
            bucket_key = f"general:{client_ip}"

        # Clean timestamps older than window
        timestamps = _RATE_LIMIT_STORE[bucket_key]
        cutoff = now - window_sec
        _RATE_LIMIT_STORE[bucket_key] = [t for t in timestamps if t > cutoff]

        if len(_RATE_LIMIT_STORE[bucket_key]) >= max_req:
            retry_after = int(window_sec - (now - _RATE_LIMIT_STORE[bucket_key][0])) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded. Maximum {max_req} requests per {window_sec}s.",
                    "retry_after_seconds": max(1, retry_after),
                },
                headers={"Retry-After": str(max(1, retry_after))},
            )

        _RATE_LIMIT_STORE[bucket_key].append(now)
        return await call_next(request)


def add_cors_middleware(app: FastAPI, allowed_origins: Sequence[str]) -> None:
    """Configure strict CORS policies preventing credentials with wildcard origins."""
    # Ensure wildcard is never combined with allow_credentials
    safe_origins = [origin for origin in allowed_origins if origin != "*"]
    if not safe_origins:
        safe_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=safe_origins,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )


def add_auth_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def auth_middleware(request: Request, call_next):
        path = request.url.path
        if request.method == "OPTIONS" or is_public_path(path):
            return await call_next(request)

        user = resolve_request_user(request)
        if user is None:
            return error_response("UNAUTHORIZED", "Authentication required", 401)
        request.state.user = user
        return await call_next(request)


def add_request_logging_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_logging_middleware(
        request: Request, call_next
    ) -> JSONResponse:
        started_at = time.monotonic()
        try:
            response = await call_next(request)
            duration_ms = int((time.monotonic() - started_at) * 1000)

            # Only log non-health requests to avoid noise
            if request.url.path != "/api/health":
                await write_log(
                    "INFO",
                    "gateway",
                    "request_completed",
                    {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                    },
                    duration_ms=duration_ms,
                )
            return response
        except Exception as error:
            duration_ms = int((time.monotonic() - started_at) * 1000)
            await write_log(
                "ERROR",
                "gateway",
                "request_failed",
                {
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(error).__name__,
                },
                duration_ms=duration_ms,
            )
            raise


def add_global_exception_handler(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, error: Exception
    ) -> JSONResponse:
        await write_log(
            "ERROR",
            "gateway",
            "unhandled_exception",
            {
                "method": request.method,
                "path": request.url.path,
                "error_type": type(error).__name__,
                "message": str(error),
            },
        )
        return error_response("INTERNAL_ERROR", "Unexpected error", 500)
