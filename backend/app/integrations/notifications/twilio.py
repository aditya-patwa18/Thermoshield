import httpx
from typing import Dict, Any
from ...config import settings
from .base import BaseNotificationProvider

class TwilioSMSProvider(BaseNotificationProvider):
    def is_configured(self) -> bool:
        return settings.is_twilio_configured

    async def send(self, recipient: str, message: str, **kwargs) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "provider": "Twilio SMS",
                "status": "unconfigured",
                "message": "SMS integration is not configured. Demo preview mode is available.",
                "recipient": recipient,
                "preview_text": message
            }

        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        data = {
            "From": settings.TWILIO_PHONE_NUMBER,
            "To": recipient,
            "Body": message
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                )
        except httpx.RequestError as exc:
            return {
                "success": False,
                "provider": "Twilio SMS",
                "status": "error",
                "error_detail": type(exc).__name__,
                "message": "Could not connect to Twilio. Check network access and try again."
            }

        if resp.status_code in (200, 201):
            body = resp.json()
            return {
                "success": True,
                "provider": "Twilio SMS",
                "status": "sent",
                "sid": body.get("sid"),
                "recipient": recipient,
                "message": "SMS successfully dispatched via Twilio."
            }
        return {
            "success": False,
            "provider": "Twilio SMS",
            "status": "error",
            "error_code": resp.status_code,
            "error_detail": resp.text,
            "message": f"Twilio API rejected the request: {resp.text}"
        }

class TwilioWhatsAppProvider(BaseNotificationProvider):
    def is_configured(self) -> bool:
        return settings.is_whatsapp_configured

    async def send(self, recipient: str, message: str, **kwargs) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "provider": "Twilio WhatsApp",
                "status": "unconfigured",
                "message": "WhatsApp integration is not configured. Demo preview mode is available.",
                "recipient": recipient,
                "preview_text": message
            }

        to_number = recipient if recipient.startswith("whatsapp:") else f"whatsapp:{recipient}"
        from_number = settings.TWILIO_WHATSAPP_FROM
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        data = {
            "From": from_number,
            "To": to_number,
            "Body": message
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                )
        except httpx.RequestError as exc:
            return {
                "success": False,
                "provider": "Twilio WhatsApp",
                "status": "error",
                "error_detail": type(exc).__name__,
                "message": "Could not connect to Twilio. Check network access and try again."
            }

        if resp.status_code in (200, 201):
            body = resp.json()
            return {
                "success": True,
                "provider": "Twilio WhatsApp",
                "status": "sent",
                "sid": body.get("sid"),
                "recipient": recipient,
                "message": "WhatsApp message successfully dispatched via Twilio."
            }
        return {
            "success": False,
            "provider": "Twilio WhatsApp",
            "status": "error",
            "error_code": resp.status_code,
            "error_detail": resp.text,
            "message": f"Twilio WhatsApp rejected the request: {resp.text}"
        }
