"""Standard API Response Envelopes."""

from __future__ import annotations

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIEnvelope(BaseModel, Generic[DataT]):
    success: bool = True
    data: Optional[DataT] = None
    error: Optional[str] = None
    message: Optional[str] = None


class PaginatedEnvelope(APIEnvelope[List[DataT]]):
    total: int = 0
    limit: int = 50
    offset: int = 0
