"""Comprehensive Test Suite for Complete /v1/auth/* Authentication Suite."""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_full_auth_v1_lifecycle():
    unique_email = f"sarah_{uuid.uuid4().hex[:6]}@sky.net"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. POST /v1/auth/signup
        signup_res = await client.post(
            "/v1/auth/signup",
            json={
                "email": unique_email,
                "password": "SecurePassword123!",
                "full_name": "Sarah Connor",
            },
        )
        assert signup_res.status_code == 201, signup_res.text
        data = signup_res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["full_name"] == "Sarah Connor"
        assert data["tenant"]["role"] == "owner"

        access_token = data["access_token"]
        refresh_token = data["refresh_token"]

        # Duplicate signup should fail with 400
        dup_res = await client.post(
            "/v1/auth/signup",
            json={
                "email": unique_email,
                "password": "AnotherPassword123!",
                "full_name": "Sarah Duplicate",
            },
        )
        assert dup_res.status_code == 400

        # 2. GET /v1/auth/me
        me_res = await client.get("/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["user"]["email"] == unique_email
        assert len(me_data["tenants"]) >= 1

        # 3. POST /v1/auth/otp/send & POST /v1/auth/otp/verify
        send_otp_res = await client.post(
            "/v1/auth/otp/send",
            json={"purpose": "email_verification"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert send_otp_res.status_code == 200

        # Retrieve OTP directly from DB for verification assertion
        db = get_db_engine()
        otp_rec = await db.fetch_one(
            "SELECT otp_code FROM email_otps WHERE email = ? AND purpose = 'email_verification' ORDER BY created_at DESC LIMIT 1",
            (unique_email,),
        )
        assert otp_rec is not None
        otp_code = otp_rec["otp_code"]

        verify_otp_res = await client.post(
            "/v1/auth/otp/verify",
            json={"otp_code": otp_code, "purpose": "email_verification"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert verify_otp_res.status_code == 200
        assert verify_otp_res.json()["is_verified"] is True

        # 4. POST /v1/auth/change-password
        change_pw_res = await client.post(
            "/v1/auth/change-password",
            json={
                "current_password": "SecurePassword123!",
                "new_password": "BrandNewPassword2026!",
            },
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert change_pw_res.status_code == 200

        # 5. POST /v1/auth/login with new password
        login_res = await client.post(
            "/v1/auth/login",
            json={
                "email": unique_email,
                "password": "BrandNewPassword2026!",
            },
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert login_data["user"]["is_verified"] is True
        new_access_token = login_data["access_token"]
        new_refresh_token = login_data["refresh_token"]

        # Old password should fail
        bad_login_res = await client.post(
            "/v1/auth/login",
            json={
                "email": unique_email,
                "password": "SecurePassword123!",
            },
        )
        assert bad_login_res.status_code == 401

        # 6. POST /v1/auth/refresh
        refresh_res = await client.post("/v1/auth/refresh", json={"refresh_token": new_refresh_token})
        assert refresh_res.status_code == 200
        refreshed_data = refresh_res.json()
        assert "access_token" in refreshed_data
        assert "refresh_token" in refreshed_data
        rotated_access_token = refreshed_data["access_token"]

        # 7. POST /v1/auth/forgot-password & POST /v1/auth/reset-password
        forgot_res = await client.post(
            "/v1/auth/forgot-password",
            json={"email": unique_email},
        )
        assert forgot_res.status_code == 200

        reset_otp_rec = await db.fetch_one(
            "SELECT otp_code FROM email_otps WHERE email = ? AND purpose = 'password_reset' ORDER BY created_at DESC LIMIT 1",
            (unique_email,),
        )
        assert reset_otp_rec is not None
        reset_otp_code = reset_otp_rec["otp_code"]

        reset_pw_res = await client.post(
            "/v1/auth/reset-password",
            json={
                "email": unique_email,
                "otp_code": reset_otp_code,
                "new_password": "ResetPassword2026!",
            },
        )
        assert reset_pw_res.status_code == 200

        # Login with reset password
        post_reset_login = await client.post(
            "/v1/auth/login",
            json={
                "email": unique_email,
                "password": "ResetPassword2026!",
            },
        )
        assert post_reset_login.status_code == 200

        # 8. POST /v1/auth/logout
        logout_res = await client.post(
            "/v1/auth/logout",
            headers={"Authorization": f"Bearer {rotated_access_token}"},
        )
        assert logout_res.status_code == 200

        # 9. GET /v1/auth/{provider}/login & callback
        google_login_res = await client.get("/v1/auth/google/login")
        assert google_login_res.status_code == 200
        assert "accounts.google.com" in google_login_res.json()["authorization_url"]

        github_login_res = await client.get("/v1/auth/github/login")
        assert github_login_res.status_code == 200
        assert "github.com/login/oauth" in github_login_res.json()["authorization_url"]

        oauth_callback_res = await client.get("/v1/auth/google/callback?code=mock_google_oauth_code_12345")
        assert oauth_callback_res.status_code == 200
        assert "access_token" in oauth_callback_res.json()
