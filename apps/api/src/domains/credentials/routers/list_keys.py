"""Credential Listing Endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from bee_api.core.dependencies import CurrentTenantDep
from bee_api.domains.credentials.schemas import CredentialListResponse
from bee_api.domains.credentials.service import CredentialVaultService

router = APIRouter(prefix="/v1/credentials", tags=["Credentials Vault"])


@router.get("", response_model=CredentialListResponse)
async def list_credentials(
    tenant: CurrentTenantDep,
) -> CredentialListResponse:
    """List all stored platform credentials for the active tenant organization."""
    items = await CredentialVaultService.list_credentials(tenant_id=tenant["id"])
    return CredentialListResponse(credentials=items, count=len(items))
