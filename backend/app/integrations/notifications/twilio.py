import re
import time
import httpx
from typing import Dict, Any, Optional
from ...config import settings
from .base import BaseNotificationProvider

TWILIO_API_BASE = "https://api.twilio.com/2010-04-01/Accounts"
ACCOUNT_LOOKUP_RETRY_SECONDS = 60.0

# Plain-language fixes for the Twilio rejections this app can actually run into.
TWILIO_ERROR_HINTS = {
    572002: "Twilio trial accounts can only message verified recipients. Verify this number in the Twilio Console (Phone Numbers > Verified Caller IDs) or upgrade the account.",
    21608: "Twilio trial accounts can only message verified recipients. Verify this number in the Twilio Console (Phone Numbers > Verified Caller IDs) or upgrade the account.",
    21211: "The recipient is not a valid phone number. Use international format, e.g. +919876543210.",
    21614: "The recipient is not a mobile number that can receive SMS.",
    21606: "TWILIO_PHONE_NUMBER is not an SMS-capable number owned by this Twilio account. Buy a number in the Twilio Console and set it in backend/.env.",
    21659: "TWILIO_PHONE_NUMBER is not an SMS-capable number owned by this Twilio account. Buy a number in the Twilio Console and set it in backend/.env.",
    21408: "SMS to this country is switched off for the account. Enable it in the Twilio Console under Messaging > Settings > Geo permissions.",
    21610: "This recipient has opted out (replied STOP) and cannot be messaged until they reply START.",
    20003: "Twilio rejected the credentials. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env.",
    30044: "The message is too long for a Twilio trial account. Shorten it or upgrade the account.",
    63007: "TWILIO_WHATSAPP_FROM is not a WhatsApp-enabled sender on this Twilio account. Use the WhatsApp sandbox number or an approved sender.",
    63015: "The recipient has not joined the Twilio WhatsApp sandbox. They must send the sandbox join code first.",
}
TRIAL_PARAMETER_HINT = (
    "This Twilio trial account only accepts Twilio's preset sample messages to verified numbers. "
    "Set TWILIO_TRIAL_TEMPLATE in backend/.env or upgrade the account to send the alert text."
)


def normalize_phone(recipient: str) -> str:
    """
    Twilio only accepts E.164 numbers, so strip the spaces, dashes and brackets people type.
    """
    prefix, sep, number = recipient.strip().rpartition(":")
    return prefix + sep + re.sub(r"[\s\-().]", "", number)


def describe_rejection(resp: httpx.Response, provider: str, channel: str) -> Dict[str, Any]:
    """
    Turns a Twilio error response into a result the UI can show as-is.
    """
    try:
        body = resp.json()
    except ValueError:
        body = {}
    if not isinstance(body, dict):
        body = {}

    detail = str(body.get("message") or f"HTTP {resp.status_code}").rstrip(".")
    code = body.get("code") or resp.status_code
    hint = TWILIO_ERROR_HINTS.get(code)
    if hint is None and "trial accounts have limited parameter access" in detail.lower():
        hint = TRIAL_PARAMETER_HINT

    result = {
        "success": False,
        "provider": provider,
        "status": "error",
        "error_code": code,
        "error_detail": body.get("message") or detail,
        "message": f"Twilio rejected the {channel} (error {code}): {detail}."
    }
    if hint:
        result["hint"] = hint
    return result


class TwilioSMSProvider(BaseNotificationProvider):
    def __init__(self):
        self._account_type: Optional[str] = None
        self._account_checked_at: Optional[float] = None

    def is_configured(self) -> bool:
        return settings.is_twilio_configured

    async def account_type(self) -> Optional[str]:
        """
        Returns Twilio's account type ("Trial" or "Full"), or None if it could not be read.
        Trial accounts follow different sending rules, so the answer is cached.
        """
        if self._account_type or not self.is_configured():
            return self._account_type
        now = time.monotonic()
        if self._account_checked_at is not None and now - self._account_checked_at < ACCOUNT_LOOKUP_RETRY_SECONDS:
            return None
        self._account_checked_at = now

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{TWILIO_API_BASE}/{settings.TWILIO_ACCOUNT_SID}.json",
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                )
            if resp.status_code == 200:
                self._account_type = resp.json().get("type")
        except (httpx.RequestError, ValueError):
            return None
        return self._account_type

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

        recipient = normalize_phone(recipient)
        url = f"{TWILIO_API_BASE}/{settings.TWILIO_ACCOUNT_SID}/Messages.json"

        # Trial accounts do not own a sender number and may only send Twilio's preset
        # sample messages: the API rejects a From parameter or a free-text Body.
        trial_template = settings.TWILIO_TRIAL_TEMPLATE if await self.account_type() == "Trial" else ""
        if trial_template:
            data = {"To": recipient, "Body": trial_template}
        else:
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

        if resp.status_code not in (200, 201):
            return describe_rejection(resp, "Twilio SMS", "SMS")

        result = {
            "success": True,
            "provider": "Twilio SMS",
            "status": "sent",
            "sid": resp.json().get("sid"),
            "recipient": recipient,
            "message": "SMS successfully dispatched via Twilio."
        }
        if trial_template:
            result["trial"] = True
            result["trial_template"] = trial_template
            result["message"] = (
                f"Twilio trial account: delivered Twilio's preset sample message ({trial_template}) "
                "instead of the alert text. Upgrade the Twilio account to send the alert itself."
            )
        return result

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

        recipient = normalize_phone(recipient)
        to_number = recipient if recipient.startswith("whatsapp:") else f"whatsapp:{recipient}"
        from_number = settings.TWILIO_WHATSAPP_FROM
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"

        url = f"{TWILIO_API_BASE}/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
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

        if resp.status_code not in (200, 201):
            return describe_rejection(resp, "Twilio WhatsApp", "WhatsApp message")

        return {
            "success": True,
            "provider": "Twilio WhatsApp",
            "status": "sent",
            "sid": resp.json().get("sid"),
            "recipient": recipient,
            "message": "WhatsApp message successfully dispatched via Twilio."
        }
