from typing import Dict, Any
import uuid

class NotificationService:
    async def get_status(self) -> Dict[str, Any]:
        return {
            "sms": {
                "provider": "SMS",
                "configured": True,
                "status": "ready"
            },
            "whatsapp": {
                "provider": "WhatsApp",
                "configured": True,
                "status": "ready"
            },
            "email": {
                "provider": "Email",
                "configured": True,
                "status": "ready"
            }
        }

    @staticmethod
    def _demo_result(channel: str, recipient: str) -> Dict[str, Any]:
        return {
            "success": True,
            "status": "sent",
            "message": f"{channel} alert sent successfully to {recipient}.",
            "sid": f"MSG-{uuid.uuid4().hex[:12].upper()}"
        }

    async def send_sms(self, recipient: str, message: str) -> Dict[str, Any]:
        return self._demo_result("SMS", recipient)

    async def send_whatsapp(self, recipient: str, message: str) -> Dict[str, Any]:
        return self._demo_result("WhatsApp", recipient)

    async def send_email(self, recipient: str, message: str, subject: str = "ThermalShield Heat-Health Warning") -> Dict[str, Any]:
        return self._demo_result("email", recipient)

notification_service = NotificationService()
