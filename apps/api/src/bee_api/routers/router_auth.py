from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from bee_api.auth import extract_bearer_token, resolve_request_user
from bee_api.models import AuthLoginRequest, AuthSignupRequest
from bee_api.response_helpers import error_response, success_response
from bee_core.stores.user_store import (
    authenticate_user,
    create_session,
    create_user,
    delete_session,
)

router = APIRouter()


@router.post("/api/auth/signup")
async def signup(request: AuthSignupRequest) -> JSONResponse:
    try:
        user = create_user(request.email, request.password, request.name)
    except ValueError as error:
        code = "EMAIL_TAKEN" if "already" in str(error).lower() else "VALIDATION_ERROR"
        return error_response(code, str(error), 400)
    token = create_session(user["id"])
    return success_response({"token": token, "user": user})


@router.post("/api/auth/login")
async def login(request: AuthLoginRequest) -> JSONResponse:
    user = authenticate_user(request.email, request.password)
    if user is None:
        return error_response("INVALID_CREDENTIALS", "Invalid email or password", 401)
    token = create_session(user["id"])
    return success_response({"token": token, "user": user})


@router.get("/api/auth/me")
async def me(request: Request) -> JSONResponse:
    user = resolve_request_user(request)
    if user is None:
        return error_response("UNAUTHORIZED", "Authentication required", 401)
    return success_response(user)


@router.post("/api/auth/logout")
async def logout(request: Request) -> JSONResponse:
    token = extract_bearer_token(request)
    if token:
        delete_session(token)
    return success_response({"logged_out": True})
