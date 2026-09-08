"""Test Suite for Encrypted Credentials Vault (/v1/credentials)."""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from bee_api.main import app
from bee_core.db.connection import get_db_engine
from bee_api.domains.credentials.service import CredentialVaultService


@pytest.fixture(autouse=True)
async def setup_db():
    engine = get_db_engine()
    await engine.init_db()


@pytest.mark.anyio
async def test_credentials_vault_lifecycle():
    user_email = f"vault_admin_{uuid.uuid4().hex[:6]}@bee.dev"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Reject unauthenticated access
        unauth_res = await client.get("/v1/credentials")
        assert unauth_res.status_code in (401, 403)

        # 2. Signup and get auth token
        signup_res = await client.post(
            "/v1/auth/signup",
            json={"email": user_email, "password": "VaultMasterPassword123!", "full_name": "Vault Master"},
        )
        assert signup_res.status_code == 201
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Store first credential (Slack Bot Token)
        raw_slack_token = "xoxb-mock-vault-secret-token-dummy-key"
        post_res = await client.post(
            "/v1/credentials",
            json={
                "platform": "slack",
                "credential_key": "BOT_TOKEN",
                "credential_value": raw_slack_token,
                "label": "Production Alerts Bot",
            },
            headers=headers,
        )
        assert post_res.status_code == 201
        data = post_res.json()
        assert data["platform"] == "slack"
        assert data["credential_key"] == "BOT_TOKEN"
        assert data["label"] == "Production Alerts Bot"
        assert data["masked_preview"] == "xoxb...UvWx"
        assert raw_slack_token not in str(data)  # Plaintext never leaked

        # 4. Store second credential (GitHub PAT)
        raw_gh_token = "ghp_VerySecretGitHubTokenValue123456"
        post_res2 = await client.post(
            "/v1/credentials",
            json={
                "platform": "github",
                "credential_key": "PERSONAL_ACCESS_TOKEN",
                "credential_value": raw_gh_token,
                "label": "CI Robot PAT",
            },
            headers=headers,
        )
        assert post_res2.status_code == 201

        # 5. List credentials
        list_res = await client.get("/v1/credentials", headers=headers)
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["count"] == 2
        platforms = [c["platform"] for c in list_data["credentials"]]
        assert "slack" in platforms
        assert "github" in platforms

        # 6. Verify at-rest encryption in DB
        db = get_db_engine()
        db_rows = await db.fetch_all("SELECT encrypted_value, masked_preview FROM tenant_credentials")
        assert len(db_rows) >= 2
        for r in db_rows:
            assert raw_slack_token not in r["encrypted_value"]
            assert raw_gh_token not in r["encrypted_value"]

        # 7. Verify internal programmatic decryption via Service
        # Get user's tenant_id
        me_res = await client.get("/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        user_id = me_res.json()["user"]["id"]
        tenant_row = await db.fetch_one(
            "SELECT tenant_id FROM tenant_memberships WHERE user_id = ?",
            (user_id,),
        )
        tenant_id = tenant_row["tenant_id"]

        decrypted_slack = await CredentialVaultService.get_decrypted_credential(
            tenant_id=tenant_id,
            platform="slack",
            credential_key="BOT_TOKEN",
        )
        assert decrypted_slack == raw_slack_token

        # 8. Update (UPSERT) existing credential
        updated_token = "xoxb-mock-vault-updated-dummy-key-rotated"
        update_res = await client.post(
            "/v1/credentials",
            json={
                "platform": "slack",
                "credential_key": "BOT_TOKEN",
                "credential_value": updated_token,
                "label": "Rotated Production Alerts Bot",
            },
            headers=headers,
        )
        assert update_res.status_code == 201
        assert update_res.json()["label"] == "Rotated Production Alerts Bot"

        decrypted_updated = await CredentialVaultService.get_decrypted_credential(
            tenant_id=tenant_id,
            platform="slack",
            credential_key="BOT_TOKEN",
        )
        assert decrypted_updated == updated_token

        # 9. Delete credential
        del_res = await client.delete("/v1/credentials/slack/BOT_TOKEN", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["deleted"] is True

        # Verify it's gone
        list_after_del = await client.get("/v1/credentials", headers=headers)
        assert list_after_del.json()["count"] == 1

        # 10. Delete non-existent credential gives 404
        del_404 = await client.delete("/v1/credentials/slack/BOT_TOKEN", headers=headers)
        assert del_404.status_code == 404
