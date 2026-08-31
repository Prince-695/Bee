"""Unit tests for Universal Database Engine and Multi-Tenant Schemas."""

import os
import tempfile
import pytest
from bee_core.db.connection import DatabaseEngine


@pytest.mark.anyio
async def test_sqlite_db_engine_lifecycle():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        engine = DatabaseEngine(database_url=None, sqlite_path=db_path)
        await engine.init_db()

        # 1. Insert Tenant
        await engine.execute(
            "INSERT INTO tenants (id, name, type, slug, plan) VALUES (?, ?, ?, ?, ?)",
            ("tenant_123", "Acme Corp", "organization", "acme-corp", "pro"),
        )
        tenant = await engine.fetch_one("SELECT * FROM tenants WHERE id = ?", ("tenant_123",))
        assert tenant is not None
        assert tenant["name"] == "Acme Corp"
        assert tenant["type"] == "organization"
        assert tenant["plan"] == "pro"

        # 2. Insert User
        await engine.execute(
            "INSERT INTO users (id, email, full_name, is_verified) VALUES (?, ?, ?, ?)",
            ("user_123", "alice@acme.com", "Alice Engineer", 1),
        )
        user = await engine.fetch_one("SELECT * FROM users WHERE id = ?", ("user_123",))
        assert user is not None
        assert user["email"] == "alice@acme.com"
        assert user["is_verified"] == 1

        # 3. Insert Tenant Membership
        await engine.execute(
            "INSERT INTO tenant_memberships (tenant_id, user_id, role) VALUES (?, ?, ?)",
            ("tenant_123", "user_123", "owner"),
        )
        membership = await engine.fetch_one(
            "SELECT * FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?",
            ("tenant_123", "user_123"),
        )
        assert membership is not None
        assert membership["role"] == "owner"

        # 4. Insert OTP
        await engine.execute(
            "INSERT INTO email_otps (id, email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
            ("otp_1", "alice@acme.com", "123456", "email_verification", "2099-01-01T00:00:00Z"),
        )
        otp = await engine.fetch_one("SELECT * FROM email_otps WHERE email = ?", ("alice@acme.com",))
        assert otp is not None
        assert otp["otp_code"] == "123456"

    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
