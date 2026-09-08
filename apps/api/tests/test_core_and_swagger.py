"""Tests for Core Platform: Encryption Vault, Swagger Basic Auth, and Health/Legal Probes."""

from __future__ import annotations

import base64
import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_api.core.config import settings
from bee_api.core.encryption import decrypt_secret, encrypt_secret, mask_secret
from bee_api.core.cookies import (
    COOKIE_ACCESS_TOKEN_KEY,
    COOKIE_REFRESH_TOKEN_KEY,
    clear_auth_cookies,
    set_auth_cookies,
)
from fastapi import Response

client = TestClient(app)


class TestEncryptionVault:
    def test_encrypt_and_decrypt_roundtrip(self):
        secret = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
        encrypted = encrypt_secret(secret)
        assert encrypted != secret
        assert isinstance(encrypted, str)

        decrypted = decrypt_secret(encrypted)
        assert decrypted == secret

    def test_encrypt_empty_string(self):
        assert encrypt_secret("") == ""
        assert decrypt_secret("") == ""

    def test_decrypt_invalid_payload_raises(self):
        with pytest.raises(ValueError):
            decrypt_secret("not-a-valid-base64-payload!!!")

    def test_decrypt_tampered_payload_raises(self):
        secret = "my-secret-key"
        encrypted = encrypt_secret(secret)
        raw = bytearray(base64.b64decode(encrypted.encode("utf-8")))
        # Flip a bit in the ciphertext
        raw[-1] ^= 0x01
        tampered = base64.b64encode(bytes(raw)).decode("utf-8")

        with pytest.raises(ValueError):
            decrypt_secret(tampered)

    def test_mask_secret(self):
        assert mask_secret("ghp_ABC123XYZ") == "ghp_...3XYZ"
        assert mask_secret("short") == "********"
        assert mask_secret("") == ""


class TestSwaggerBasicAuthAndOpenAPI:
    def test_docs_unauthorized_without_basic_auth(self):
        response = client.get("/docs")
        assert response.status_code == 401
        assert "Basic" in response.headers.get("WWW-Authenticate", "")

    def test_docs_unauthorized_with_wrong_password(self):
        response = client.get("/docs", auth=("admin", "wrong_password"))
        assert response.status_code == 401

    def test_docs_authorized_with_correct_credentials(self):
        response = client.get(
            "/docs",
            auth=(settings.SWAGGER_USERNAME, settings.SWAGGER_PASSWORD),
        )
        assert response.status_code == 200
        assert "Swagger Documentation" in response.text

    def test_openapi_schema_contains_security_schemes_and_servers(self):
        response = client.get(
            "/openapi.json",
            auth=(settings.SWAGGER_USERNAME, settings.SWAGGER_PASSWORD),
        )
        assert response.status_code == 200
        schema = response.json()
        assert "components" in schema
        assert "securitySchemes" in schema["components"]
        assert "HTTPBearer" in schema["components"]["securitySchemes"]
        assert schema["components"]["securitySchemes"]["HTTPBearer"]["type"] == "http"
        assert schema["components"]["securitySchemes"]["HTTPBearer"]["scheme"] == "bearer"

        # Verify dual server toggle
        assert len(schema.get("servers", [])) >= 2
        server_urls = [s["url"] for s in schema["servers"]]
        assert any("localhost" in u for u in server_urls)
        assert any("https://api.bee.dev" in u for u in server_urls)


class TestHealthAndReadinessProbes:
    def test_liveness_probe_returns_200(self):
        response = client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "bee-api"

    def test_readiness_probe_returns_200(self):
        response = client.get("/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["database"] is True


class TestLegalAndCookiePolicy:
    def test_get_cookie_policy_returns_declarations(self):
        response = client.get("/v1/legal/cookie-policy")
        assert response.status_code == 200
        data = response.json()
        assert data["policy_name"] == "Bee Cookie Policy"
        assert len(data["cookies"]) >= 2
        cookie_names = [c["name"] for c in data["cookies"]]
        assert "bee_access_token" in cookie_names
        assert "bee_refresh_token" in cookie_names

    def test_post_cookie_consent_records_preference(self):
        response = client.post(
            "/v1/legal/cookie-consent",
            json={"accepted": True, "analytics_accepted": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["consent_id"] is not None


class TestCookieManagement:
    def test_set_and_clear_auth_cookies(self):
        resp = Response()
        set_auth_cookies(resp, "test-access-token", "test-refresh-token")
        cookie_headers = resp.headers.getlist("set-cookie")
        cookie_str = "; ".join(cookie_headers)
        assert COOKIE_ACCESS_TOKEN_KEY in cookie_str
        assert COOKIE_REFRESH_TOKEN_KEY in cookie_str
        assert "HttpOnly" in cookie_str

        resp_clear = Response()
        clear_auth_cookies(resp_clear)
        clear_headers = "; ".join(resp_clear.headers.getlist("set-cookie"))
        assert COOKIE_ACCESS_TOKEN_KEY in clear_headers
        assert COOKIE_REFRESH_TOKEN_KEY in clear_headers
