import asyncio
from urllib.parse import parse_qs

import httpx
import pytest

from app.config import settings
from app.integrations.notifications import twilio as twilio_module
from app.integrations.notifications.twilio import (
    TwilioSMSProvider,
    TwilioWhatsAppProvider,
    normalize_phone,
)

ALERT_TEXT = "🚨 HEAT ADVISORY: Mumbai is experiencing VERY HIGH heat stress (37.2°C)."


@pytest.fixture
def twilio_configured(monkeypatch):
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "ACtest")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setattr(settings, "TWILIO_PHONE_NUMBER", "+15005550006")
    monkeypatch.setattr(settings, "TWILIO_WHATSAPP_FROM", "+14155238886")
    monkeypatch.setattr(settings, "TWILIO_TRIAL_TEMPLATE", "sms_internal_alerts")


def fake_twilio(monkeypatch, account_type="Full", send_status=201, send_body=None):
    """Routes every Twilio HTTP call to an in-memory handler and records the message POSTs."""
    sent = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            if account_type is None:
                return httpx.Response(500, json={"message": "unavailable"})
            return httpx.Response(200, json={"type": account_type, "status": "active"})
        sent.append({k: v[0] for k, v in parse_qs(request.content.decode()).items()})
        return httpx.Response(send_status, json=send_body or {"sid": "SM123", "status": "queued"})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        twilio_module.httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs),
    )
    return sent


@pytest.mark.parametrize("raw,expected", [
    ("+91 98765 43210", "+919876543210"),
    ("+1 (737) 250-8034", "+17372508034"),
    ("  +919876543210 ", "+919876543210"),
    ("whatsapp:+91 98765 43210", "whatsapp:+919876543210"),
])
def test_normalize_phone(raw, expected):
    assert normalize_phone(raw) == expected


def test_full_account_sends_alert_text_from_configured_number(monkeypatch, twilio_configured):
    sent = fake_twilio(monkeypatch, account_type="Full")
    result = asyncio.run(TwilioSMSProvider().send("+91 98765 43210", ALERT_TEXT))

    assert sent == [{"From": "+15005550006", "To": "+919876543210", "Body": ALERT_TEXT}]
    assert result["success"] is True
    assert result["status"] == "sent"
    assert result["sid"] == "SM123"
    assert result["recipient"] == "+919876543210"


def test_trial_account_sends_preset_template_without_from(monkeypatch, twilio_configured):
    # Twilio trial accounts reject custom bodies and the From parameter.
    sent = fake_twilio(monkeypatch, account_type="Trial")
    result = asyncio.run(TwilioSMSProvider().send("+919876543210", ALERT_TEXT))

    assert sent == [{"To": "+919876543210", "Body": "sms_internal_alerts"}]
    assert result["success"] is True
    assert result["trial"] is True
    assert result["trial_template"] == "sms_internal_alerts"
    assert "trial" in result["message"].lower()


def test_trial_template_can_be_disabled(monkeypatch, twilio_configured):
    monkeypatch.setattr(settings, "TWILIO_TRIAL_TEMPLATE", "")
    sent = fake_twilio(monkeypatch, account_type="Trial")
    asyncio.run(TwilioSMSProvider().send("+919876543210", ALERT_TEXT))

    assert sent == [{"From": "+15005550006", "To": "+919876543210", "Body": ALERT_TEXT}]


def test_account_lookup_failure_falls_back_to_standard_send(monkeypatch, twilio_configured):
    sent = fake_twilio(monkeypatch, account_type=None)
    result = asyncio.run(TwilioSMSProvider().send("+919876543210", ALERT_TEXT))

    assert sent == [{"From": "+15005550006", "To": "+919876543210", "Body": ALERT_TEXT}]
    assert result["success"] is True


@pytest.mark.parametrize("code,fragment", [
    (572002, "verified"),
    (21608, "verified"),
    (21606, "TWILIO_PHONE_NUMBER"),
    (21408, "Geo permissions"),
    (20003, "TWILIO_AUTH_TOKEN"),
])
def test_twilio_rejection_is_explained(monkeypatch, twilio_configured, code, fragment):
    twilio_message = "No Twilio trial phone number is assigned for messaging to this destination number."
    fake_twilio(
        monkeypatch,
        send_status=422,
        send_body={"code": code, "message": twilio_message, "status": 422},
    )
    result = asyncio.run(TwilioSMSProvider().send("+919876543210", ALERT_TEXT))

    assert result["success"] is False
    assert result["status"] == "error"
    assert result["error_code"] == code
    assert result["error_detail"] == twilio_message
    assert fragment in result["hint"]
    # The UI shows `message` verbatim: it must read as a sentence, not a JSON dump.
    assert "{" not in result["message"]


def test_non_json_rejection_does_not_crash(monkeypatch, twilio_configured):
    def handler(request):
        if request.method == "GET":
            return httpx.Response(200, json={"type": "Full"})
        return httpx.Response(502, text="<html>Bad Gateway</html>")

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        twilio_module.httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs),
    )
    result = asyncio.run(TwilioSMSProvider().send("+919876543210", ALERT_TEXT))

    assert result["success"] is False
    assert result["error_code"] == 502


def test_whatsapp_normalizes_recipient_and_explains_errors(monkeypatch, twilio_configured):
    sent = fake_twilio(
        monkeypatch,
        send_status=400,
        send_body={"code": 63007, "message": "Twilio could not find a Channel with the specified From address"},
    )
    result = asyncio.run(TwilioWhatsAppProvider().send("+91 98765 43210", ALERT_TEXT))

    assert sent[0]["To"] == "whatsapp:+919876543210"
    assert sent[0]["From"] == "whatsapp:+14155238886"
    assert result["success"] is False
    assert result["error_code"] == 63007
    assert "TWILIO_WHATSAPP_FROM" in result["hint"]


def test_health_reports_trial_mode(monkeypatch, twilio_configured):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.integrations.notifications.service import notification_service

    fake_twilio(monkeypatch, account_type="Trial")
    monkeypatch.setattr(notification_service, "sms_provider", TwilioSMSProvider())

    sms = TestClient(app).get("/api/health").json()["notifications"]["sms"]
    assert sms["configured"] is True
    assert sms["trial"] is True
    assert sms["trial_template"] == "sms_internal_alerts"
