"""Email & OTP Notification Service."""

from __future__ import annotations

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional


class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_from = os.getenv("SMTP_FROM", "Bee Security <security@bee.dev>")

    async def send_otp_email(self, to_email: str, otp_code: str, purpose: str = "verification") -> bool:
        """Send 6-digit OTP code to the recipient email."""
        subject = f"Your Bee {purpose.replace('_', ' ').title()} Code: {otp_code}"
        body_text = f"Your 6-digit security code for Bee is: {otp_code}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email."

        if not self.smtp_host or not self.smtp_user:
            # Development fallback / Mock logger
            print(f"[EMAIL SERVICE - DEV MOCK] Sent {purpose} OTP [{otp_code}] to {to_email}")
            return True

        try:
            msg = MIMEMultipart()
            msg["From"] = self.smtp_from
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            if self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.smtp_from, [to_email], msg.as_string())
            server.quit()
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {e}")
            return False


_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
