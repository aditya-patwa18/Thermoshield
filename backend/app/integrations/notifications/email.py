import smtplib
import ssl
from html import escape
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import httpx
from ...config import settings
from .base import BaseNotificationProvider

class EmailNotificationProvider(BaseNotificationProvider):
    def is_configured(self) -> bool:
        return settings.is_email_configured

    async def send(self, recipient: str, message: str, subject: str = "ThermalShield Heat-Health Warning", **kwargs) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "provider": "Twilio Email" if settings.EMAIL_PROVIDER == "twilio" else "SMTP Email",
                "status": "unconfigured",
                "message": "Email delivery is not configured. Demo preview mode is available.",
                "recipient": recipient,
                "subject": subject,
                "preview_text": message
            }

        if settings.EMAIL_PROVIDER == "twilio":
            return await self._send_with_twilio(recipient, message, subject)

        return self._send_with_smtp(recipient, message, subject)

    async def _send_with_twilio(self, recipient: str, message: str, subject: str) -> Dict[str, Any]:
        url = "https://comms.twilio.com/v1/Emails"
        payload = {
            "from": {
                "address": settings.twilio_email_from,
                "name": settings.TWILIO_EMAIL_FROM_NAME,
            },
            "to": [{"address": recipient}],
            "content": {
                "subject": subject,
                "html": f"<p>{escape(message).replace(chr(10), '<br>')}</p>",
            },
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                )
            if response.is_error:
                detail = response.text[:500]
                return {
                    "success": False,
                    "provider": "Twilio Email",
                    "status": "error",
                    "error_code": response.status_code,
                    "error_detail": detail,
                    "message": f"Twilio email delivery failed (HTTP {response.status_code}): {detail}",
                }
            result = response.json() if response.content else {}
            return {
                "success": True,
                "provider": "Twilio Email",
                "status": "sent",
                "recipient": recipient,
                "subject": subject,
                "sid": result.get("sid") or result.get("id"),
                "message": "Email alert successfully dispatched.",
            }
        except httpx.HTTPError as exc:
            return {
                "success": False,
                "provider": "Twilio Email",
                "status": "error",
                "message": f"Twilio email request failed: {exc}",
            }

    def _send_with_smtp(self, recipient: str, message: str, subject: str) -> Dict[str, Any]:
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
