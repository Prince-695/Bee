"""Automated Test Suite for Comprehensive Security Hardening & Vulnerability Controls."""

import pytest
from starlette.testclient import TestClient
from fastapi import HTTPException

from bee_api.main import app
from bee_api.security.sanitization import sanitize_html, sanitize_user_input, is_safe_sql_identifier
from bee_api.security.upload_security import validate_uploaded_file, sanitize_filename
from bee_api.core.email import EmailService, MAX_EMAILS_PER_HOUR, _EMAIL_SEND_TIMESTAMPS
from bee_api.core.dependencies import verify_tenant_ownership
from bee_core.config import mask_secret, validate_environment


from bee_core.stores.user_store import init_user_db

@pytest.fixture
def client():
    init_user_db()
    return TestClient(app)


# ─── 1. Git & Secret Concealment Tests ───

def test_secret_masking():
    """Verify secrets are masked to prevent leak in logs and diagnostics."""
    assert mask_secret("") == ""
    assert mask_secret("short") == "********"
    assert mask_secret("sk-proj-1234567890abcdef91ba") == "sk-...91ba"
    assert mask_secret("ghp_123456789012345678901234567890123456") == "ghp...3456"


def test_environment_validation():
    """Verify environment validator flags critical issues without throwing."""
    report = validate_environment()
    assert "debug_mode" in report
    assert "cors_origins" in report
    assert isinstance(report["issues"], list)


# ─── 2. Input Sanitization & XSS Defense Tests ───

def test_xss_script_stripping():
    """Verify script tags, event handlers, and javascript URIs are neutralized."""
    malicious = "<script>alert('pwned')</script>Fix login bug"
    clean = sanitize_html(malicious)
    assert "<script>" not in clean
    assert "alert" not in clean
    assert "Fix login bug" in clean

    img_xss = '<img src="x" onerror="alert(1)">Critical patch'
    assert "onerror" not in sanitize_html(img_xss)

    js_uri = 'Check <a href="javascript:steal()">link</a>'
    assert "javascript:" not in sanitize_html(js_uri)


def test_recursive_input_sanitization():
    """Verify dict/list structures are sanitized recursively."""
    payload = {
        "title": "<script>evil()</script>Bug in auth",
        "tags": ["<iframe src='bad.com'></iframe>security", "backend"],
        "metadata": {"note": "<b onmouseover='alert(1)'>hello</b>"},
    }
    cleaned = sanitize_user_input(payload)
    assert "<script>" not in cleaned["title"]
    assert "Bug in auth" in cleaned["title"]
    assert "<iframe>" not in cleaned["tags"][0]
    assert "onmouseover" not in cleaned["metadata"]["note"]


def test_sql_identifier_safety():
    """Verify safe SQL table/column name validation."""
    assert is_safe_sql_identifier("users") is True
    assert is_safe_sql_identifier("tenant_memberships") is True
    assert is_safe_sql_identifier("users; DROP TABLE users;--") is False
    assert is_safe_sql_identifier("table name with spaces") is False
    assert is_safe_sql_identifier("' OR '1'='1") is False


# ─── 3. Secure File Upload Tests ───

def test_file_upload_blocked_extensions():
    """Ensure executable and dangerous extensions are rejected."""
    for bad_name in ["script.exe", "trojan.sh", "exploit.bat", "webshell.php", "backdoor.scr"]:
        valid, err = validate_uploaded_file(bad_name, b"dummy content")
        assert not valid
        assert "not permitted" in err or "prohibited" in err


def test_file_upload_path_traversal():
    """Ensure directory traversal characters are stripped from filenames."""
    dirty = "../../../etc/passwd"
    clean = sanitize_filename(dirty)
    assert ".." not in clean
    assert "/" not in clean
    assert clean == "passwd"

    win_dirty = "..\\..\\windows\\system32\\cmd.exe"
    clean_win = sanitize_filename(win_dirty)
    assert "\\" not in clean_win
    assert "cmd.exe" in clean_win or "cmd_exe" in clean_win


def test_file_upload_magic_bytes():
    """Ensure file content matches expected format signatures."""
    # Fake PNG with valid extension but invalid magic bytes
    valid, err = validate_uploaded_file("photo.png", b"NOT_A_REAL_PNG")
    assert not valid
    assert "magic byte mismatch" in err

    # Genuine PNG magic bytes
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    valid, err = validate_uploaded_file("photo.png", png_bytes)
    assert valid
    assert err == ""


# ─── 4. Rate Limiting Tests ───

def test_auth_rate_limiting(client):
    """Verify rapid auth requests trigger HTTP 429 Too Many Requests."""
    # Attempt 7 rapid login attempts
    responses = []
    for _ in range(7):
        resp = client.post(
            "/api/auth/login",
            json={"email": "ratelimit_test@example.com", "password": "wrong_password"},
        )
        responses.append(resp.status_code)

    # At least one request beyond the limit (5 req/min) should return 429
    assert 429 in responses


# ─── 5. Email Send Caps Tests ───

@pytest.mark.anyio
async def test_email_send_caps():
    """Verify EmailService enforces hourly limits per recipient."""
    recipient = "test_cap@example.com"
    _EMAIL_SEND_TIMESTAMPS.pop(recipient, None)

    # First MAX_EMAILS_PER_HOUR should succeed
    for _ in range(MAX_EMAILS_PER_HOUR):
        assert EmailService.check_send_cap(recipient) is True

    # Next attempt should raise 429
    with pytest.raises(HTTPException) as exc_info:
        EmailService.check_send_cap(recipient)
    assert exc_info.value.status_code == 429
    assert "limit exceeded" in exc_info.value.detail.lower()


# ─── 6. Security Headers Tests ───

def test_security_headers_present(client):
    """Verify HTTP response headers enforce strict security policies."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    headers = resp.headers

    assert "X-Content-Type-Options" in headers
    assert headers["X-Content-Type-Options"] == "nosniff"

    assert "X-Frame-Options" in headers
    assert headers["X-Frame-Options"] == "DENY"

    assert "Content-Security-Policy" in headers
    assert "default-src 'self'" in headers["Content-Security-Policy"]

    assert "Strict-Transport-Security" in headers
    assert "max-age=" in headers["Strict-Transport-Security"]

    assert "Referrer-Policy" in headers
    assert "Server" not in headers


# ─── 7. Admin Protection & RBAC Tests ───

def test_admin_route_requires_auth(client):
    """Verify unauthenticated requests to /v1/admin/* are rejected with 401."""
    resp = client.get("/v1/admin/health/security")
    assert resp.status_code == 401


# ─── 8. IDOR Tenant Isolation Tests ───

def test_tenant_boundary_isolation():
    """Verify verify_tenant_ownership prevents cross-tenant access."""
    active_tenant = {"tenant_id": "tenant-org-alpha", "role": "member"}

    # Same tenant should pass without exception
    verify_tenant_ownership("tenant-org-alpha", active_tenant)

    # Cross tenant should raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        verify_tenant_ownership("tenant-org-beta", active_tenant)
    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail
