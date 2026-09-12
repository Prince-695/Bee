"""Secure file upload validator, path traversal defense, and magic byte checking."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Tuple

MAX_DEFAULT_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
    ".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".csv",
    ".py", ".ts", ".tsx", ".js", ".jsx", ".css", ".html",
}

BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".vbs", ".pif", ".scr",
    ".com", ".msi", ".php", ".phtml", ".jsp", ".asp", ".aspx",
    ".dll", ".so", ".dylib", ".bin",
}

MAGIC_SIGNATURES = {
    ".png": b"\x89PNG\r\n\x1a\n",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".gif": (b"GIF87a", b"GIF89a"),
    ".pdf": b"%PDF-",
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and null byte injection."""
    if not filename:
        return "unnamed_file"

    # Strip null bytes
    cleaned = filename.replace("\x00", "")
    # Extract only the base name (prevents /path/to or ../../ traversal)
    cleaned = os.path.basename(cleaned)
    # Remove dangerous shell characters
    cleaned = re.sub(r"[^a-zA-Z0-9_.-]", "_", cleaned)
    # Avoid empty filenames or hidden files starting with .
    if not cleaned or cleaned.startswith("."):
        cleaned = f"file_{cleaned}"

    return cleaned


def validate_uploaded_file(
    filename: str,
    content: bytes,
    max_size_bytes: int = MAX_DEFAULT_UPLOAD_SIZE,
) -> Tuple[bool, str]:
    """Validate uploaded file size, extension, and content signatures.
    
    Returns:
        (is_valid: bool, error_message: str)
    """
    if not content:
        return False, "File is empty"

    if len(content) > max_size_bytes:
        return False, f"File size exceeds maximum allowed limit of {max_size_bytes // (1024 * 1024)}MB"

    # Check extension
    safe_name = sanitize_filename(filename)
    ext = Path(safe_name).suffix.lower()

    if ext in BLOCKED_EXTENSIONS:
        return False, f"File extension '{ext}' is explicitly prohibited for security reasons"

    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File extension '{ext}' is not permitted in upload allowlist"

    # Verify magic bytes for common binary formats
    if ext in MAGIC_SIGNATURES:
        expected = MAGIC_SIGNATURES[ext]
        if isinstance(expected, tuple):
            if not any(content.startswith(sig) for sig in expected):
                return False, f"File content does not match genuine '{ext}' signature (magic byte mismatch)"
        elif not content.startswith(expected):
            return False, f"File content does not match genuine '{ext}' signature (magic byte mismatch)"

    return True, ""
