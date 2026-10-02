from typing import Dict, Any
from .twilio import TwilioSMSProvider, TwilioWhatsAppProvider
from .email import EmailNotificationProvider
from ...config import settings

class NotificationService:
    def __init__(self):
        self.sms_provider = TwilioSMSProvider()
        self.whatsapp_provider = TwilioWhatsAppProvider()
        self.email_provider = EmailNotificationProvider()

    async def get_status(self) -> Dict[str, Any]:
        sms_trial = await self.sms_provider.account_type() == "Trial"
        sms_template = settings.TWILIO_TRIAL_TEMPLATE if sms_trial else ""
        return {
            "sms": {
                "provider": "Twilio SMS",
                "configured": self.sms_provider.is_configured(),
                "status": (
                    "unconfigured_demo_preview" if not self.sms_provider.is_configured()
                    else "trial_sample_messages_only" if sms_template
                    else "ready"
                ),
                "trial": sms_trial,
                "trial_template": sms_template or None
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
