"""Token & Cost Budgeting Engine for LLM flight usage auditing."""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Token pricing rates per 1M tokens in USD
MODEL_RATES = {
    "gemini-2.5-flash": {"prompt": 0.15 / 1_000_000, "completion": 0.60 / 1_000_000},
    "gemini-2.5-pro": {"prompt": 1.25 / 1_000_000, "completion": 5.00 / 1_000_000},
    "claude-3-5-sonnet": {"prompt": 3.00 / 1_000_000, "completion": 15.00 / 1_000_000},
    "gpt-4o": {"prompt": 2.50 / 1_000_000, "completion": 10.00 / 1_000_000},
    "default": {"prompt": 0.50 / 1_000_000, "completion": 1.50 / 1_000_000},
}


class TokenUsageRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: f"tok_{uuid.uuid4().hex[:8]}")
    route_id: Optional[str] = None
    flight_id: Optional[str] = None
    model: str = "gemini-2.5-flash"
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    created_at: str = Field(default_factory=_utc_now_iso)


class BudgetEngine:
    """Manages token consumption, cost calculations, and hard budget limits."""

    def __init__(self, db_path: str = "./bee.db") -> None:
        self.db_path = str(Path(db_path).resolve())
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS token_usage (
                    record_id TEXT PRIMARY KEY,
                    route_id TEXT,
                    flight_id TEXT,
                    model TEXT NOT NULL,
                    prompt_tokens INTEGER NOT NULL,
                    completion_tokens INTEGER NOT NULL,
                    total_tokens INTEGER NOT NULL,
                    estimated_cost_usd REAL NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    @staticmethod
    def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
        rates = MODEL_RATES.get(model, MODEL_RATES["default"])
        cost = (prompt_tokens * rates["prompt"]) + (completion_tokens * rates["completion"])
        return round(cost, 6)

    def record_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        route_id: Optional[str] = None,
        flight_id: Optional[str] = None,
    ) -> TokenUsageRecord:
        total_tokens = prompt_tokens + completion_tokens
        cost = self.calculate_cost(model, prompt_tokens, completion_tokens)
        record = TokenUsageRecord(
            route_id=route_id,
            flight_id=flight_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost,
        )

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO token_usage (
                    record_id, route_id, flight_id, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.record_id,
                    record.route_id,
                    record.flight_id,
                    record.model,
                    record.prompt_tokens,
                    record.completion_tokens,
                    record.total_tokens,
                    record.estimated_cost_usd,
                    record.created_at,
                ),
            )
            conn.commit()
        return record

    def get_aggregate_spend(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            row = conn.execute(
                """
                SELECT 
                    COUNT(*) as total_flights,
                    COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
                    COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
                    COALESCE(SUM(total_tokens), 0) as total_tokens,
                    COALESCE(SUM(estimated_cost_usd), 0.0) as total_cost_usd
                FROM token_usage
                """
            ).fetchone()
            if not row:
                return {
                    "total_flights": 0,
                    "total_prompt_tokens": 0,
                    "total_completion_tokens": 0,
                    "total_tokens": 0,
                    "total_cost_usd": 0.0,
                }
            return {
                "total_flights": row["total_flights"],
                "total_prompt_tokens": row["total_prompt_tokens"],
                "total_completion_tokens": row["total_completion_tokens"],
                "total_tokens": row["total_tokens"],
                "total_cost_usd": round(row["total_cost_usd"], 4),
            }

    def list_usage_records(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM token_usage ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(row) for row in rows]
