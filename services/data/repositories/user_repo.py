"""User & Session Repository for Bee Platform."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from bee_core.stores.user_store import (
    create_user,
    authenticate_user,
    create_session,
    get_user_for_token,
    delete_session,
    init_user_db,
)
from services.data.repository import BaseRepository


class UserRepository(BaseRepository):
    """Repository handling users and session tokens."""

    def init_db(self) -> None:
        init_user_db()

    def create_user(self, email: str, password: str, name: str = "") -> Dict[str, Any]:
        return create_user(email=email, password=password, name=name)

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        return authenticate_user(email=email, password=password)

    def create_session(self, user_id: str) -> str:
        return create_session(user_id=user_id)

    def get_user_for_token(self, token: str) -> Optional[Dict[str, Any]]:
        return get_user_for_token(token=token)

    def delete_session(self, token: str) -> None:
        delete_session(token=token)


__all__ = [
    "UserRepository",
    "create_user",
    "authenticate_user",
    "create_session",
    "get_user_for_token",
    "delete_session",
    "init_user_db",
]
