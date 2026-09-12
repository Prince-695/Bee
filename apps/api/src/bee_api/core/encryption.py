"""Enterprise AES-256-GCM Vault Encryption Engine.

Secures third-party tokens, API keys, and workspace credentials at rest.
"""

from __future__ import annotations

import base64
import os
import hashlib
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from bee_api.core.config import settings


def _derive_key(secret: str) -> bytes:
    """Derives a fixed 32-byte (256-bit) key using SHA-256."""
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_secret(plaintext: str, key_override: Optional[str] = None) -> str:
    """Encrypts a sensitive string using AES-256-GCM with a unique 12-byte nonce.

    Returns:
        Base64-encoded string containing [12-byte nonce + ciphertext + 16-byte tag].
    """
    if not plaintext:
        return ""

    key = _derive_key(key_override or settings.TOKEN_ENCRYPTION_KEY)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Standard 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_secret(encrypted_payload: str, key_override: Optional[str] = None) -> str:
    """Decrypts a base64 payload created by encrypt_secret.

    Raises:
        ValueError: If decryption fails or payload has been tampered with.
    """
    if not encrypted_payload:
        return ""

    try:
        raw = base64.b64decode(encrypted_payload.encode("utf-8"))
        if len(raw) < 28:  # 12-byte nonce + at least 16-byte tag
            raise ValueError("Encrypted payload is too short")

        nonce, ciphertext = raw[:12], raw[12:]
        key = _derive_key(key_override or settings.TOKEN_ENCRYPTION_KEY)
        aesgcm = AESGCM(key)
        plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext_bytes.decode("utf-8")
    except Exception as exc:
        raise ValueError(f"Secret decryption failed: {exc}") from exc


def mask_secret(secret: str) -> str:
    """Returns a safe masked preview of a secret (e.g. ghp_...3a9f)."""
    if not secret:
        return ""
    if len(secret) <= 8:
        return "********"
    return f"{secret[:4]}...{secret[-4:]}"
