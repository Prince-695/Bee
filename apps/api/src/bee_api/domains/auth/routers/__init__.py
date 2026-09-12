"""Authentication Domain Routers Aggregate."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.domains.auth.routers import (
    signup,
    login,
    logout,
    refresh,
    me,
    otp,
    password_reset,
    oauth,
)

router = APIRouter()
router.include_router(signup.router)
router.include_router(login.router)
router.include_router(logout.router)
router.include_router(refresh.router)
router.include_router(me.router)
router.include_router(otp.router)
router.include_router(password_reset.router)
router.include_router(oauth.router)
