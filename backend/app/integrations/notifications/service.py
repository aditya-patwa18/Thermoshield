from typing import Dict, Any
from .twilio import TwilioSMSProvider, TwilioWhatsAppProvider
from .email import EmailNotificationProvider
from ...config import settings

class NotificationService:
    def __init__(self):
        self.sms_provider = TwilioSMSProvider()
        self.whatsapp_provider = TwilioWhatsAppProvider()
        self.email_provider = EmailNotificationProvider()

    def get_status(self) -> Dict[str, Any]:
        return {
            "sms": {
                "provider": "Twilio SMS",
                "configured": self.sms_provider.is_configured(),
                "status": "ready" if self.sms_provider.is_configured() else "unconfigured_demo_preview"
            },
            "whatsapp": {
                "provider": "Twilio WhatsApp",
                "configured": self.whatsapp_provider.is_configured(),
                "status": "ready" if self.whatsapp_provider.is_configured() else "unconfigured_demo_preview"
            },
            "email": {
                "provider": "SMTP Email",
                "configured": self.email_provider.is_configured(),
                "status": "ready" if self.email_provider.is_configured() else "unconfigured_demo_preview"
            }
        }

    async def send_sms(self, recipient: str, message: str) -> Dict[str, Any]:
        return await self.sms_provider.send(recipient, message)

    async def send_whatsapp(self, recipient: str, message: str) -> Dict[str, Any]:
        return await self.whatsapp_provider.send(recipient, message)

    async def send_email(self, recipient: str, message: str, subject: str = "ThermalShield Heat-Health Warning") -> Dict[str, Any]:
        return await self.email_provider.send(recipient, message, subject=subject)

notification_service = NotificationService()
