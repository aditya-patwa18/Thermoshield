import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
from ...config import settings
from .base import BaseNotificationProvider

class EmailNotificationProvider(BaseNotificationProvider):
    def is_configured(self) -> bool:
        return settings.is_smtp_configured

    async def send(self, recipient: str, message: str, subject: str = "ThermalShield Heat-Health Warning", **kwargs) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "provider": "SMTP Email",
                "status": "unconfigured",
                "message": "SMTP email integration is not configured. Demo preview mode is available.",
                "recipient": recipient,
                "subject": subject,
                "preview_text": message
            }

        try:
            msg = MIMEMultipart()
            msg["From"] = settings.SMTP_FROM
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "plain"))

            smtp_context = ssl.create_default_context()
            if settings.SMTP_PORT == 465:
                server_context = smtplib.SMTP_SSL(
                    settings.SMTP_HOST,
                    settings.SMTP_PORT,
                    timeout=10.0,
                    context=smtp_context
                )
            else:
                server_context = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0)

            with server_context as server:
                if settings.SMTP_PORT != 465:
                    server.ehlo()
                    if not server.has_extn("starttls"):
                        raise RuntimeError("SMTP server does not support STARTTLS.")
                    server.starttls(context=smtp_context)
                    server.ehlo()
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)

            return {
                "success": True,
                "provider": "SMTP Email",
                "status": "sent",
                "recipient": recipient,
                "subject": subject,
                "message": "Email alert successfully dispatched."
            }
        except Exception as e:
            return {
                "success": False,
                "provider": "SMTP Email",
                "status": "error",
                "error_detail": str(e),
                "message": f"SMTP delivery failed: {str(e)}"
            }
