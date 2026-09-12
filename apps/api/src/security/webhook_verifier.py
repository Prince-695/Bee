"""Cryptographic Webhook Ingress Signature Verifier.

Enforces HMAC-SHA256 payload integrity verification for GitHub, Sentry, and CI signals.
"""

from __future__ import annotations

import hmac
import hashlib
import time
from typing import Optional


class WebhookVerifier:
    """Verifies cryptographic signatures on incoming webhooks."""

    @staticmethod
    def verify_github_signature(
        payload: bytes,
        secret: str,
        signature_header: Optional[str],
    ) -> bool:
        """Verify GitHub 'X-Hub-Signature-256' header (sha256=<hex_digest>)."""
        if not signature_header or not secret:
            return False

        if not signature_header.startswith("sha256="):
            return False

        expected_sig = signature_header[7:]
        computed_sig = hmac.new(
            secret.encode("utf-8"),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed_sig, expected_sig)

    @staticmethod
    def verify_sentry_signature(
        payload: bytes,
        secret: str,
        signature_header: Optional[str],
    ) -> bool:
        """Verify Sentry 'Sentry-Hook-Signature' HMAC-SHA256 digest."""
        if not signature_header or not secret:
            return False

        computed_sig = hmac.new(
            secret.encode("utf-8"),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed_sig, signature_header)

    @staticmethod
    def verify_bee_webhook_signature(
        payload: bytes,
        secret: str,
        signature_header: Optional[str],
        timestamp_header: Optional[str] = None,
        max_drift_seconds: int = 300,
    ) -> bool:
        """Verify custom Bee webhook with replay attack prevention."""
        if not signature_header or not secret:
            return False

        # Replay prevention if timestamp is provided
        if timestamp_header:
            try:
                ts = int(timestamp_header)
                if abs(time.time() - ts) > max_drift_seconds:
                    return False
                to_sign = f"{ts}.".encode("utf-8") + payload
            except (ValueError, TypeError):
                return False
        else:
            to_sign = payload

        computed_sig = hmac.new(
            secret.encode("utf-8"),
            to_sign,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed_sig, signature_header)
