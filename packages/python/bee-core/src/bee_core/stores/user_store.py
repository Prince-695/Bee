from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from bee_core.config import DB_PATH

_DB_LOCK = threading.Lock()
_TOKEN_TTL_HOURS = 72


def _db_path() -> Path:
    return Path(DB_PATH).expanduser()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _utc_now_iso() -> str:
    return _utc_now().isoformat()


def _get_connection() -> sqlite3.Connection:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path), check_same_thread=False)
    connection.row_factory = sqlite3.Row
    return connection


def init_user_db() -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL DEFAULT '',
                    password_hash TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """
            )
            connection.commit()


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        120_000,
    )
    return digest.hex()


def create_user(email: str, password: str, name: str = "") -> dict[str, Any]:
    normalized = email.strip().lower()
    if not normalized or "@" not in normalized:
        raise ValueError("Invalid email")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    user_id = str(uuid.uuid4())[:12]
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    now = _utc_now_iso()

    with _DB_LOCK:
        with _get_connection() as connection:
            existing = connection.execute(
                "SELECT id FROM users WHERE email = ?", (normalized,)
            ).fetchone()
            if existing is not None:
                raise ValueError("Email already registered")
            connection.execute(
                """
                INSERT INTO users (id, email, name, password_hash, password_salt, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, normalized, name.strip(), password_hash, salt, now),
            )
            connection.commit()

    return {"id": user_id, "email": normalized, "name": name.strip()}


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                "SELECT id, email, name, password_hash, password_salt FROM users WHERE email = ?",
                (normalized,),
            ).fetchone()
    if row is None:
        return None
    expected = row["password_hash"]
    actual = _hash_password(password, row["password_salt"])
    if not hmac.compare_digest(expected, actual):
        return None
    return {"id": row["id"], "email": row["email"], "name": row["name"]}


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    now = _utc_now()
    expires = now + timedelta(hours=_TOKEN_TTL_HOURS)
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute(
                """
                INSERT INTO auth_sessions (token, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token, user_id, now.isoformat(), expires.isoformat()),
            )
            connection.commit()
    return token


def get_user_for_token(token: str) -> dict[str, Any] | None:
    if not token:
        return None
    now = _utc_now()
    with _DB_LOCK:
        with _get_connection() as connection:
            row = connection.execute(
                """
                SELECT u.id, u.email, u.name, s.expires_at
                FROM auth_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token = ?
                """,
                (token,),
            ).fetchone()
            if row is None:
                return None
            expires_at = datetime.fromisoformat(row["expires_at"])
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now:
                connection.execute("DELETE FROM auth_sessions WHERE token = ?", (token,))
                connection.commit()
                return None
    return {"id": row["id"], "email": row["email"], "name": row["name"]}


def delete_session(token: str) -> None:
    with _DB_LOCK:
        with _get_connection() as connection:
            connection.execute("DELETE FROM auth_sessions WHERE token = ?", (token,))
            connection.commit()
