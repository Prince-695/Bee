"""Credential Deletion Endpoint."""

from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.credentials.service import CredentialVaultService

router = APIRouter(prefix="/v1/credentials", tags=["Credentials Vault"])


@router.delete("/{platform}/{credential_key}")
async def delete_credential(
    platform: str,
    credential_key: str,
    tenant: CurrentTenantDep,
) -> Dict[str, Any]:
    """Permanently delete a credential from the tenant's vault."""
    success = await CredentialVaultService.delete_credential(
        tenant_id=tenant["id"],
        platform=platform,
        credential_key=credential_key,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Credential for '{platform}' with key '{credential_key}' not found.",
        )
    return {
        "deleted": True,
        "platform": platform.lower(),
        "credential_key": credential_key.upper(),
    }
