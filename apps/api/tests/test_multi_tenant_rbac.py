"""Comprehensive Test Suite for Multi-Tenant Organizations and RBAC (/v1/tenants/* and /v1/users/*)."""

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
async def test_multi_tenant_rbac_lifecycle():
    owner_email = f"owner_{uuid.uuid4().hex[:6]}@acme.com"
    member_email = f"member_{uuid.uuid4().hex[:6]}@acme.com"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register Owner
        owner_signup = await client.post(
            "/v1/auth/signup",
            json={"email": owner_email, "password": "OwnerPassword123!", "full_name": "Alice Owner"},
        )
        assert owner_signup.status_code == 201
        owner_token = owner_signup.json()["access_token"]
        owner_id = owner_signup.json()["user"]["id"]

        # 2. Register Member
        member_signup = await client.post(
            "/v1/auth/signup",
            json={"email": member_email, "password": "MemberPassword123!", "full_name": "Bob Member"},
        )
        assert member_signup.status_code == 201
        member_token = member_signup.json()["access_token"]
        member_id = member_signup.json()["user"]["id"]

        # 3. Update Profile for Member
        update_res = await client.put(
            "/v1/users/me",
            json={"full_name": "Bob Updated", "avatar_url": "https://avatar.com/bob.png"},
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert update_res.status_code == 200
        assert update_res.json()["full_name"] == "Bob Updated"

        # 4. Create Organization Tenant
        create_org_res = await client.post(
            "/v1/tenants",
            json={"name": "Cyberdyne Systems", "plan": "pro"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert create_org_res.status_code == 201
        org_data = create_org_res.json()
        org_id = org_data["id"]
        assert org_data["name"] == "Cyberdyne Systems"
        assert org_data["role"] == "owner"

        # 5. List Owner's tenants
        list_tenants = await client.get("/v1/tenants", headers={"Authorization": f"Bearer {owner_token}"})
        assert list_tenants.status_code == 200
        assert len(list_tenants.json()["tenants"]) >= 2  # Personal + Cyberdyne

        # 6. Add Bob to Cyberdyne as Developer Member
        add_member_res = await client.post(
            f"/v1/tenants/{org_id}/members",
            json={"email": member_email, "role": "member"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert add_member_res.status_code == 201
        assert add_member_res.json()["role"] == "member"

        # 7. List Members of Cyberdyne
        members_res = await client.get(
            f"/v1/tenants/{org_id}/members",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert members_res.status_code == 200
        members = members_res.json()["members"]
        assert len(members) == 2  # Alice (Owner) + Bob (Member)

        # 8. Member tries to remove Owner (Should fail with 403)
        unauth_remove = await client.delete(
            f"/v1/tenants/{org_id}/members/{owner_id}",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert unauth_remove.status_code == 403

        # 9. Owner removes Member (Should succeed)
        remove_res = await client.delete(
            f"/v1/tenants/{org_id}/members/{member_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert remove_res.status_code == 200
