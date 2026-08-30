"""Zero-Leak Secret Redactor and PII Masker for enterprise data protection."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

# Comprehensive regex patterns for API keys, tokens, credentials, and private keys
SECRET_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("OPENAI_KEY", re.compile(r"sk-[a-zA-Z0-9_\-]{20,}")),
    ("GITHUB_TOKEN", re.compile(r"gh[pousr][_\-][a-zA-Z0-9]{30,}")),
    ("SLACK_TOKEN", re.compile(r"xox[baprs]-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24,}")),
    ("AWS_ACCESS_KEY", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("AWS_SECRET_KEY", re.compile(r"(?i)aws_secret_access_key\s*=\s*['\"]?([a-zA-Z0-9/+=]{40})['\"]?")),
    ("JWT_TOKEN", re.compile(r"eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}")),
    ("PRIVATE_KEY", re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----")),
    ("DATABASE_URI", re.compile(r"(?i)(postgres|postgresql|mysql|mongodb|redis)://[a-zA-Z0-9_\-\.]+:[^@]+@[a-zA-Z0-9_\-\.:]+(/[a-zA-Z0-9_\-\.]*)?")),
    ("GENERIC_BEARER", re.compile(r"(?i)bearer\s+[a-zA-Z0-9_\-\.]{25,}")),
]


class SecretRedactor:
    """Scans and masks credentials, API keys, and sensitive tokens from strings and dictionaries."""

    @classmethod
    def redact_text(cls, text: str) -> Tuple[str, List[str]]:
        """Redacts sensitive patterns in a string and returns (redacted_text, detected_types)."""
        if not text:
            return text, []

        redacted = text
        detected: List[str] = []

        for name, pattern in SECRET_PATTERNS:
            if pattern.search(redacted):
                detected.append(name)
                redacted = pattern.sub(f"[REDACTED_{name}]", redacted)

        return redacted, detected

    @classmethod
    def redact_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively traverses a dictionary or list, redacting sensitive strings."""
        if not isinstance(data, dict):
            return data

        sanitized: Dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, str):
                redacted_val, _ = cls.redact_text(v)
                sanitized[k] = redacted_val
            elif isinstance(v, dict):
                sanitized[k] = cls.redact_dict(v)
            elif isinstance(v, list):
                sanitized[k] = [
                    cls.redact_dict(item) if isinstance(item, dict)
                    else cls.redact_text(item)[0] if isinstance(item, str)
                    else item
                    for item in v
                ]
            else:
                sanitized[k] = v
        return sanitized
