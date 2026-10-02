import sys
from pathlib import Path

import pytest

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))


@pytest.fixture(autouse=True)
def no_real_notification_credentials(monkeypatch):
    # A developer's local .env may hold live Twilio/SMTP credentials: never use them from tests.
    from app.config import settings

    for name in (
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
        "TWILIO_WHATSAPP_FROM",
        "SMTP_HOST",
    ):
        monkeypatch.setattr(settings, name, "")
