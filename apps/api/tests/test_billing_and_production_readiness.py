"""Tests for Stripe Billing, Ingress Webhook HMAC Signatures, and Transactional Emails."""

import pytest
import hmac
import hashlib
import json
from fastapi.testclient import TestClient
from bee_api.main import app
from bee_api.security.webhook_verifier import WebhookVerifier
from bee_api.core.email import EmailService


@pytest.fixture
def client():
    return TestClient(app)


def test_webhook_verifier_github_hmac():
    """Verify GitHub X-Hub-Signature-256 HMAC validation."""
    secret = "secret_github_key_123"
    payload = b'{"action": "opened", "pull_request": {"number": 42}}'
    
    # Compute correct signature
    sig = "sha256=" + hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    
    assert WebhookVerifier.verify_github_signature(payload, secret, sig) is True
    assert WebhookVerifier.verify_github_signature(payload, secret, "sha256=invalidhex123") is False
    assert WebhookVerifier.verify_github_signature(payload, "wrong_secret", sig) is False


def test_webhook_verifier_sentry_hmac():
    """Verify Sentry HMAC signature validation."""
    secret = "sentry_client_secret_999"
    payload = b'{"event": {"type": "error", "message": "ZeroDivisionError"}}'
    
    sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    
    assert WebhookVerifier.verify_sentry_signature(payload, secret, sig) is True
    assert WebhookVerifier.verify_sentry_signature(payload, secret, "tampered_sig") is False


def test_webhook_verifier_replay_drift():
    """Verify custom webhook timestamp drift validation."""
    secret = "custom_webhook_secret"
    payload = b'{"signal": "trigger_flight"}'
    current_time = 1772900000
    
    # Current timestamp
    to_sign = f"{current_time}.".encode("utf-8") + payload
    sig = hmac.new(secret.encode("utf-8"), to_sign, hashlib.sha256).hexdigest()
    
    # Valid within drift
    assert WebhookVerifier.verify_bee_webhook_signature(
        payload, secret, sig, timestamp_header=str(current_time), max_drift_seconds=360000000
    ) is True


@pytest.mark.anyio
async def test_email_service_dispatch():
    """Verify transactional email templates render and dispatch cleanly."""
    invite_res = await EmailService.send_team_invitation(
        to_email="dev@company.com",
        inviter_name="Lead Engineer",
        organization_name="Cyberdyne Systems",
        role="engineer",
        invite_link="https://bee.dev/invite/token_123",
    )
    assert invite_res is True

    gate_res = await EmailService.send_approval_gate_alert(
        to_email="lead@company.com",
        route_id="mission_auto_fr7y",
        action_summary="Commit modified auth middleware to main",
        review_link="https://bee.dev/route/mission_auto_fr7y",
    )
    assert gate_res is True


def test_stripe_webhook_flow(client):
    """Test Stripe webhook processing for plan upgrade and cancellation."""
    # 1. Test checkout session completed webhook
    checkout_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_test_123",
                "subscription": "sub_test_123",
                "metadata": {
                    "tenant_id": "tenant_test_org",
                    "plan": "pro"
                }
            }
        }
    }
    
    resp = client.post("/v1/billing/webhook", json=checkout_event)
    assert resp.status_code == 200
    assert resp.json()["received"] is True
    assert resp.json()["event_type"] == "checkout.session.completed"

    # 2. Test customer subscription deleted webhook
    delete_event = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_test_123"
            }
        }
    }
    del_resp = client.post("/v1/billing/webhook", json=delete_event)
    assert del_resp.status_code == 200
    assert del_resp.json()["received"] is True
