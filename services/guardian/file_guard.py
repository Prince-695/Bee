"""Strict Sensitive File Shield for Guardian Security Layer."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Iterable, List, Sequence, Union


class GuardrailSecurityViolation(Exception):
    """Raised when an agent or tool violates security boundaries by accessing sensitive files."""
    def __init__(self, message: str, path: str = "", operation: str = ""):
        super().__init__(message)
        self.path = path
        self.operation = operation


class FileGuard:
    """Enterprise filesystem shield preventing unauthorized inspection or modification of sensitive files."""

    # Exact base filenames or patterns that must NEVER be accessed by workers
    BLOCKED_PATTERNS: Sequence[re.Pattern[str]] = [
        # Environment files
        re.compile(r"(^|/)\.env(\.[a-zA-Z0-9_\-]+)?$", re.IGNORECASE),
        # SSH keys and configurations
        re.compile(r"(^|/)\.ssh(/.*)?$", re.IGNORECASE),
        re.compile(r"(^|/)id_[a-zA-Z0-9_\-]+(\.pub)?$", re.IGNORECASE),
        # Certificates, private keys & secrets
        re.compile(r".*\.(pem|key|pkcs12|pfx|p12|keystore)$", re.IGNORECASE),
        # Git internal credentials and private configs
        re.compile(r"(^|/)\.git/(credentials|config(\.local)?)$", re.IGNORECASE),
        # System directories
        re.compile(r"^/(etc|proc|sys|root)(/.*)?$", re.IGNORECASE),
        # Credential and token storage files
        re.compile(r"(^|/)(credentials|tokens?|service[_-]account)\.json$", re.IGNORECASE),
        # Database secrets and auth vaults
        re.compile(r"(^|/)(\.vault|secret[s]?\.ya?ml|auth_tokens?\.json)$", re.IGNORECASE),
    ]

    # Command inspection patterns to catch shell commands reading sensitive files
    SHELL_INSPECTION_PATTERNS: Sequence[re.Pattern[str]] = [
        re.compile(r"\b(cat|head|tail|less|more|nano|vim|grep|awk|sed|source|\.)\s+([^\s;&|]*\.env[^\s;&|]*)", re.IGNORECASE),
        re.compile(r"\b(cat|head|tail|less|more|grep)\s+([^\s;&|]*\.(pem|key|pkcs12)[^\s;&|]*)", re.IGNORECASE),
        re.compile(r"\b(cat|head|tail|less|more|grep)\s+([^\s;&|]*id_[a-zA-Z0-9_\-]+[^\s;&|]*)", re.IGNORECASE),
        re.compile(r"\b(cat|head|tail|less|more|grep)\s+([^\s;&|]*credentials\.json[^\s;&|]*)", re.IGNORECASE),
        re.compile(r"\bcp\s+[^\s;&|]*\.env[^\s;&|]*", re.IGNORECASE),
        re.compile(r"\bmv\s+[^\s;&|]*\.env[^\s;&|]*", re.IGNORECASE),
    ]

    # Whitelisted documentation / template files that are safe
    SAFE_TEMPLATES = {".env.example", ".env.sample", ".env.template"}

    @classmethod
    def is_sensitive_path(cls, target_path: Union[str, Path]) -> bool:
        """Determines if the given file path matches any restricted pattern."""
        raw_str = str(target_path).strip()
        if not raw_str:
            return False

        normalized = os.path.normpath(raw_str).replace("\\", "/")
        path_name = os.path.basename(normalized)

        if path_name.lower() in cls.SAFE_TEMPLATES:
            return False

        for pattern in cls.BLOCKED_PATTERNS:
            if pattern.search(normalized) or pattern.search(path_name):
                return True

        return False

    @classmethod
    def validate_path_access(cls, target_path: Union[str, Path], operation: str = "read") -> None:
        """Validates that a file or path may be accessed.

        Raises:
            GuardrailSecurityViolation: If the target path is restricted.
        """
        raw_str = str(target_path)
        if cls.is_sensitive_path(target_path):
            raise GuardrailSecurityViolation(
                f"Guardian Security Violation: Operation '{operation}' on restricted sensitive path '{raw_str}' is forbidden.",
                path=raw_str,
                operation=operation,
            )

    @classmethod
    def filter_file_list(cls, paths: Iterable[str]) -> List[str]:
        """Sanitizes a list of paths, filtering out any restricted files so workers cannot observe them."""
        return [p for p in paths if not cls.is_sensitive_path(p)]

    @classmethod
    def audit_shell_command(cls, command: str) -> None:
        """Inspects shell commands for attempts to read or modify sensitive files."""
        if not command:
            return

        # Tokenize by whitespace and punctuation to inspect referenced targets
        tokens = re.findall(r"[a-zA-Z0-9_\-\.\/\\]+", command)
        for token in tokens:
            if cls.is_sensitive_path(token):
                raise GuardrailSecurityViolation(
                    f"Guardian Security Violation: Shell command attempts to access restricted sensitive path: '{token}'",
                    path=token,
                    operation="shell_execution",
                )
