"""Test Suite for HttpOnly Cookie Authentication and Transparent Auto-Refresh."""

import uuid
from datetime import timedelta
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine
from bee_api.core.cookies import COOKIE_ACCESS_TOKEN_KEY, COOKIE_REFRESH_TOKEN_KEY
from bee_api.core.security import create_access_token


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_cookie_auth_and_auto_refresh_lifecycle():
    user_email = f"cookie_user_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Signup and verify cookies are set on response
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "CookiePassword123!", "full_name": "Cookie User"},
        )
        assert signup_res.status_code == 201
        cookies = signup_res.cookies
        assert COOKIE_ACCESS_TOKEN_KEY in cookies
        assert COOKIE_REFRESH_TOKEN_KEY in cookies

        # 2. Access protected endpoint (/v1/auth/me) with ONLY cookies (no Authorization header)
        me_res = await client.get("/v1/auth/me")
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["user"]["email"] == user_email
        assert len(me_data["tenants"]) >= 1

        # 3. Simulate expired/missing access token: clear access token while preserving valid 7-day refresh token
        user_id = me_data["user"]["id"]
        refresh_token_val = client.cookies.get(COOKIE_REFRESH_TOKEN_KEY)
        client.cookies.clear()
        client.cookies.set(COOKIE_REFRESH_TOKEN_KEY, refresh_token_val)

        # 4. Request protected endpoint again: backend should transparently auto-refresh the access token
        refresh_me_res = await client.get("/v1/auth/me")
        assert refresh_me_res.status_code == 200
        assert refresh_me_res.json()["user"]["id"] == user_id
        # Response should include new X-Access-Token header and new cookie
        assert "X-Access-Token" in refresh_me_res.headers
        assert COOKIE_ACCESS_TOKEN_KEY in refresh_me_res.cookies
        new_cookie_val = refresh_me_res.cookies[COOKIE_ACCESS_TOKEN_KEY]
        assert bool(new_cookie_val) is True

        # 5. Logout clears cookies
        logout_res = await client.post("/v1/auth/logout")
        assert logout_res.status_code == 200
        # Check that logout response issues expired cookies
        logout_cookies = logout_res.headers.get_list("set-cookie")
        assert any(COOKIE_ACCESS_TOKEN_KEY in c and "Max-Age=0" in c for c in logout_cookies)
        assert any(COOKIE_REFRESH_TOKEN_KEY in c and "Max-Age=0" in c for c in logout_cookies)
