"""Zero-Trust Human Approval Gates Router (/v1/approvals/*).

Compatibility shim re-exporting modular domain router.
"""

from __future__ import annotations

from bee_api.domains.approvals.schemas import (
    GateActionRequest,
    ApprovalGateItem,
    ApprovalGateListResponse,
)
from bee_api.domains.approvals.routers import router

__all__ = [
    "router",
    "GateActionRequest",
    "ApprovalGateItem",
    "ApprovalGateListResponse",
]
