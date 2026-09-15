"""Encrypted Credentials Vault Service.

Handles secure storage, retrieval, and lifecycle of third-party platform credentials.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from bee_core.db.connection import get_db_engine
from bee_api.core.encryption import encrypt_secret, decrypt_secret, mask_secret
from bee_api.domains.credentials.schemas import CredentialItem


class CredentialVaultService:
    """Enterprise credential storage service backing third-party integrations."""

    @staticmethod
    async def store_credential(
        tenant_id: str,
        platform: str,
        credential_key: str,
        credential_value: str,
        label: str = "",
    ) -> CredentialItem:
        db = get_db_engine()
        platform_norm = platform.strip().lower()
        key_norm = credential_key.strip().upper()
        encrypted_val = encrypt_secret(credential_value)
        masked_val = mask_secret(credential_value)

        existing = await db.fetch_one(
            "SELECT id, created_at FROM tenant_credentials WHERE tenant_id = ? AND platform = ? AND credential_key = ?",
            (tenant_id, platform_norm, key_norm),
        )

        if existing:
            cred_id = existing["id"]
            created_at = str(existing.get("created_at", ""))
            await db.execute(
                """
                UPDATE tenant_credentials 
                SET encrypted_value = ?, masked_preview = ?, label = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (encrypted_val, masked_val, label, cred_id),
            )
        else:
            cred_id = f"cred_{uuid.uuid4().hex[:12]}"
            await db.execute(
                """
                INSERT INTO tenant_credentials (id, tenant_id, platform, credential_key, encrypted_value, masked_preview, label)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (cred_id, tenant_id, platform_norm, key_norm, encrypted_val, masked_val, label),
            )
            created_at = ""

        row = await db.fetch_one(
            "SELECT id, platform, credential_key, masked_preview, label, created_at FROM tenant_credentials WHERE id = ?",
            (cred_id,),
        )
        return CredentialItem(
            id=row["id"],
            platform=row["platform"],
            credential_key=row["credential_key"],
            masked_preview=row["masked_preview"],
            label=row.get("label") or "",
            created_at=str(row.get("created_at", "")),
        )

    @staticmethod
    async def list_credentials(tenant_id: str) -> List[CredentialItem]:
        db = get_db_engine()
        rows = await db.fetch_all(
            """
            SELECT id, platform, credential_key, masked_preview, label, created_at
            FROM tenant_credentials
            WHERE tenant_id = ?
            ORDER BY platform ASC, credential_key ASC
            """,
            (tenant_id,),
        )
        return [
            CredentialItem(
                id=r["id"],
                platform=r["platform"],
                credential_key=r["credential_key"],
                masked_preview=r["masked_preview"],
                label=r.get("label") or "",
                created_at=str(r.get("created_at", "")),
            )
            for r in rows
        ]

    @staticmethod
    async def get_decrypted_credential(
        tenant_id: str,
        platform: str,
        credential_key: str,
    ) -> Optional[str]:
        db = get_db_engine()
        row = await db.fetch_one(
            "SELECT encrypted_value FROM tenant_credentials WHERE tenant_id = ? AND platform = ? AND credential_key = ?",
            (tenant_id, platform.strip().lower(), credential_key.strip().upper()),
        )
        if not row or not row.get("encrypted_value"):
            return None
        return decrypt_secret(row["encrypted_value"])

    @staticmethod
    async def delete_credential(
        tenant_id: str,
        platform: str,
        credential_key: str,
    ) -> bool:
        db = get_db_engine()
        platform_norm = platform.strip().lower()
        key_norm = credential_key.strip().upper()

        existing = await db.fetch_one(
            "SELECT id FROM tenant_credentials WHERE tenant_id = ? AND platform = ? AND credential_key = ?",
            (tenant_id, platform_norm, key_norm),
        )
        if not existing:
            return False

        await db.execute(
            "DELETE FROM tenant_credentials WHERE tenant_id = ? AND platform = ? AND credential_key = ?",
            (tenant_id, platform_norm, key_norm),
        )
        return True

    @staticmethod
    async def delete_platform_credentials(
        tenant_id: str,
        platform: str,
    ) -> int:
        db = get_db_engine()
        platform_norm = platform.strip().lower()
        rows = await db.fetch_all(
            "SELECT id FROM tenant_credentials WHERE tenant_id = ? AND platform = ?",
            (tenant_id, platform_norm),
        )
        if not rows:
            return 0
        await db.execute(
            "DELETE FROM tenant_credentials WHERE tenant_id = ? AND platform = ?",
            (tenant_id, platform_norm),
        )
        return len(rows)

