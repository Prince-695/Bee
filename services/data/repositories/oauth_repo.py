"""OAuth Connector Repository for Bee Platform."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from bee_core.stores.oauth_store import OAuthStore
from services.data.repository import BaseRepository


class OAuthRepository(BaseRepository):
    """Repository managing user third-party OAuth connections and tokens."""

    def __init__(self, db: Optional[Any] = None, db_path: str = "./bee.db") -> None:
        super().__init__(db)
        self._store = OAuthStore(db_path=db_path)

    def store_token(
        self,
        user_id: str,
        provider: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return self._store.store_token(
            user_id=user_id,
            provider=provider,
            access_token=access_token,
            refresh_token=refresh_token,
            scopes=scopes,
            metadata=metadata,
        )

    def get_token(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        return self._store.get_token(user_id=user_id, provider=provider)

    def list_connectors(self, user_id: str) -> List[Dict[str, Any]]:
        return self._store.list_connectors(user_id=user_id)

    def delete_token(self, user_id: str, provider: str) -> bool:
        return self._store.delete_token(user_id=user_id, provider=provider)


__all__ = ["OAuthRepository", "OAuthStore"]
