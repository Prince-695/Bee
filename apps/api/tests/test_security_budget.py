"""Unit tests for SecretRedactor, BudgetEngine, and Security REST API."""

import pytest
from fastapi.testclient import TestClient

from bee_api.main import app
from bee_core.security.budget_engine import BudgetEngine
from bee_core.security.secret_redactor import SecretRedactor


def test_secret_redactor_text():
    sample_text = (
        "Here is my OpenAI key sk-1234567890abcdef12345678 and GitHub token ghp_123456789012345678901234567890123456. "
        "Also DB: postgresql://admin:secretPass123@db.prod.internal:5432/main"
    )
    redacted, detected = SecretRedactor.redact_text(sample_text)
    assert "[REDACTED_OPENAI_KEY]" in redacted
    assert "[REDACTED_GITHUB_TOKEN]" in redacted
    assert "[REDACTED_DATABASE_URI]" in redacted
    assert "sk-1234567890" not in redacted
    assert "ghp_12345678" not in redacted
    assert "secretPass123" not in redacted
    assert "OPENAI_KEY" in detected
    assert "GITHUB_TOKEN" in detected
    assert "DATABASE_URI" in detected


def test_secret_redactor_dict():
    nested_data = {
        "headers": {"Authorization": "Bearer sk-99887766554433221100aabb"},
        "env": {"AWS_ACCESS_KEY_ID": "AKIAIOSFODNN7EXAMPLE"},
        "clean_field": "hello world",
    }
    sanitized = SecretRedactor.redact_dict(nested_data)
    assert "[REDACTED_OPENAI_KEY]" in sanitized["headers"]["Authorization"]
    assert "[REDACTED_AWS_ACCESS_KEY]" in sanitized["env"]["AWS_ACCESS_KEY_ID"]
    assert sanitized["clean_field"] == "hello world"


def test_budget_engine(tmp_path):
    db_file = tmp_path / "test_budget.db"
    engine = BudgetEngine(str(db_file))

    # 1. Record usage
    record = engine.record_usage(
        model="gemini-2.5-flash",
        prompt_tokens=10_000,
        completion_tokens=2_000,
        route_id="rt_budget_01",
    )
    assert record.total_tokens == 12_000
    assert record.estimated_cost_usd > 0

    # 2. Get aggregate spend
    spend = engine.get_aggregate_spend()
    assert spend["total_flights"] == 1
    assert spend["total_tokens"] == 12_000
    assert spend["total_cost_usd"] > 0


def test_security_api_endpoints():
    client = TestClient(app)

    # 1. Test Redact API with synthetic token
    mock_slack = "xoxb" + "-1111111111" + "-2222222222" + "-abcdef1234567890abcdef12"
    redact_resp = client.post(
        "/api/security/redact",
        json={"text": f"export SLACK_BOT_TOKEN={mock_slack}"},
    )
    assert redact_resp.status_code == 200
    data = redact_resp.json()["data"]
    assert data["secret_count"] >= 1
    assert "[REDACTED_SLACK_TOKEN]" in data["redacted_text"]

    # 2. Test Record Spend API
    spend_resp = client.post(
        "/api/security/record-spend",
        json={"model": "gemini-2.5-flash", "prompt_tokens": 5000, "completion_tokens": 1000},
    )
    assert spend_resp.status_code == 201
    assert spend_resp.json()["data"]["total_tokens"] == 6000

    # 3. Get Spend API
    get_spend = client.get("/api/security/spend")
    assert get_spend.status_code == 200
    assert get_spend.json()["data"]["total_tokens"] >= 6000
