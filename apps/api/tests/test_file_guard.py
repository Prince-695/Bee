"""Tests for Guardian FileGuard sensitive file protection and SecretRedactor."""

import pytest
from services.guardian.file_guard import FileGuard, GuardrailSecurityViolation
from services.guardian.secret_redactor import SecretRedactor


def test_sensitive_path_detection():
    """Verify that sensitive paths are recognized as restricted."""
    # .env files
    assert FileGuard.is_sensitive_path(".env")
    assert FileGuard.is_sensitive_path("/path/to/project/.env")
    assert FileGuard.is_sensitive_path(".env.local")
    assert FileGuard.is_sensitive_path(".env.production")
    assert FileGuard.is_sensitive_path("apps/api/.env")

    # SSH keys and credentials
    assert FileGuard.is_sensitive_path(".ssh/id_rsa")
    assert FileGuard.is_sensitive_path("/home/user/.ssh/id_ed25519")
    assert FileGuard.is_sensitive_path("id_rsa")
    assert FileGuard.is_sensitive_path("id_ecdsa.pub")

    # Certificates & private keys
    assert FileGuard.is_sensitive_path("server.key")
    assert FileGuard.is_sensitive_path("cert.pem")
    assert FileGuard.is_sensitive_path("keystore.pkcs12")

    # Git credentials
    assert FileGuard.is_sensitive_path(".git/credentials")
    assert FileGuard.is_sensitive_path(".git/config")

    # System paths
    assert FileGuard.is_sensitive_path("/etc/passwd")
    assert FileGuard.is_sensitive_path("/proc/version")
    assert FileGuard.is_sensitive_path("/sys/class")

    # Credential vaults
    assert FileGuard.is_sensitive_path("credentials.json")
    assert FileGuard.is_sensitive_path("token.json")
    assert FileGuard.is_sensitive_path(".vault")


def test_safe_path_allowance():
    """Verify standard project files are permitted."""
    assert not FileGuard.is_sensitive_path("main.py")
    assert not FileGuard.is_sensitive_path("src/components/Header.tsx")
    assert not FileGuard.is_sensitive_path("README.md")
    assert not FileGuard.is_sensitive_path("pyproject.toml")
    assert not FileGuard.is_sensitive_path("package.json")
    assert not FileGuard.is_sensitive_path(".env.example")  # .env.example is public documentation


def test_validate_path_access_raises_violation():
    """Verify validate_path_access raises GuardrailSecurityViolation on restricted access."""
    with pytest.raises(GuardrailSecurityViolation) as exc_info:
        FileGuard.validate_path_access(".env", operation="read")
    assert ".env" in str(exc_info.value)
    assert exc_info.value.operation == "read"

    with pytest.raises(GuardrailSecurityViolation):
        FileGuard.validate_path_access("/home/user/.ssh/id_rsa", operation="write")

    # Should not raise for safe files
    FileGuard.validate_path_access("src/index.ts", operation="read")
    FileGuard.validate_path_access("package.json", operation="write")


def test_filter_file_list():
    """Verify sensitive files are sanitized from listings."""
    raw_files = [
        "src/main.py",
        ".env",
        "README.md",
        "private.key",
        ".env.local",
        "docs/guide.md",
        "credentials.json",
    ]
    filtered = FileGuard.filter_file_list(raw_files)
    assert filtered == ["src/main.py", "README.md", "docs/guide.md"]


def test_audit_shell_command():
    """Verify shell commands attempting to access sensitive files are blocked."""
    with pytest.raises(GuardrailSecurityViolation):
        FileGuard.audit_shell_command("cat .env")

    with pytest.raises(GuardrailSecurityViolation):
        FileGuard.audit_shell_command("less .env.local")

    with pytest.raises(GuardrailSecurityViolation):
        FileGuard.audit_shell_command("grep SECRET server.key")

    with pytest.raises(GuardrailSecurityViolation):
        FileGuard.audit_shell_command("cp .env /tmp/leak")

    # Safe commands should pass
    FileGuard.audit_shell_command("ls -la src/")
    FileGuard.audit_shell_command("pytest apps/api/tests")
    FileGuard.audit_shell_command("cat README.md")


def test_gemini_and_anthropic_secret_redaction():
    """Verify SecretRedactor redacts Gemini, Anthropic, and OpenAI API keys."""
    # Gemini Key
    gemini_key = "AIzaSy" + "A" * 33
    text = f"Using Gemini API key: {gemini_key}"
    redacted, types = SecretRedactor.redact_text(text)
    assert "GEMINI_KEY" in types
    assert gemini_key not in redacted
    assert "[REDACTED_GEMINI_KEY]" in redacted

    # Anthropic Key
    anthropic_key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456"
    text2 = f"Anthropic token: {anthropic_key}"
    redacted2, types2 = SecretRedactor.redact_text(text2)
    assert "ANTHROPIC_KEY" in types2
    assert anthropic_key not in redacted2
    assert "[REDACTED_ANTHROPIC_KEY]" in redacted2
