"""Input sanitization, XSS mitigation, and SQL injection defense utilities."""

from __future__ import annotations

import html
import re
from typing import Any, Dict, List, Union

# Patterns matching malicious script injections and dangerous URI schemes
DANGEROUS_HTML_PATTERNS = [
    re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*object[^>]*>.*?<\s*/\s*object\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*embed[^>]*>.*?<\s*/\s*embed\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<\s*style[^>]*>.*?<\s*/\s*style\s*>", re.IGNORECASE | re.DOTALL),
    re.compile(r"on\w+\s*=\s*([\"'][^\"']*[\"']|[^\s>]+)", re.IGNORECASE),
    re.compile(r"javascript:\s*", re.IGNORECASE),
    re.compile(r"vbscript:\s*", re.IGNORECASE),
    re.compile(r"data:\s*text/html", re.IGNORECASE),
]

SAFE_IDENTIFIER_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


def sanitize_html(content: str) -> str:
    """Strip malicious script tags, event handlers, and active content from text."""
    if not content or not isinstance(content, str):
        return content

    sanitized = content
    for pattern in DANGEROUS_HTML_PATTERNS:
        sanitized = pattern.sub("", sanitized)

    return sanitized


def sanitize_user_input(data: Any) -> Any:
    """Recursively sanitize user input across dicts, lists, and strings."""
    if isinstance(data, str):
        return sanitize_html(data)
    elif isinstance(data, dict):
        return {k: sanitize_user_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_user_input(item) for item in data]
    return data


def is_safe_sql_identifier(identifier: str) -> bool:
    """Verify that a table or column name contains only safe alphanumeric/underscore characters."""
    if not identifier or not isinstance(identifier, str):
        return False
    return bool(SAFE_IDENTIFIER_PATTERN.match(identifier))
