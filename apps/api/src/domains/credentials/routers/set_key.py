"""Credential Storage Endpoint."""

from __future__ import annotations

from fastapi import APIRouter, status

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.credentials.schemas import CredentialStoreRequest, CredentialItem
from bee_api.domains.credentials.service import CredentialVaultService

router = APIRouter(prefix="/v1/credentials", tags=["Credentials Vault"])


@router.post("", response_model=CredentialItem, status_code=status.HTTP_201_CREATED)
async def store_credential(
    payload: CredentialStoreRequest,
    tenant: CurrentTenantDep,
) -> CredentialItem:
    """Securely encrypt and store a third-party credential in the vault."""
    return await CredentialVaultService.store_credential(
        tenant_id=tenant["id"],
        platform=payload.platform,
        credential_key=payload.credential_key,
        credential_value=payload.credential_value,
        label=payload.label or "",
    )
