from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone

from ..engine.alerts import ALERT_TEMPLATES, format_alert_message, generate_recommendations
from ..integrations.notifications.service import notification_service
from ..schemas import (
    SendSMSRequest,
    SendWhatsAppRequest,
    SendEmailRequest,
    NotificationPreviewRequest
)
from ..services.location_service import location_service

router = APIRouter(tags=["Alerts & Multi-Channel Notifications"])

@router.get("/alerts", summary="List Currently Active Monitored Heat Alerts")
async def get_active_alerts():
    """
    Returns active heatwave and thermal stress warnings across monitored jurisdictions.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    # Simulated active alerts for key monitored cities currently under heat strain
    return [
        {
            "alert_id": "alt-mum-01",
            "severity": "VERY HIGH",
            "location": "Mumbai, Maharashtra",
            "city_id": "mumbai",
            "valid_from": now_iso,
            "valid_until": "2026-10-02T18:00:00Z",
            "title": "Very High Heat & Humidity Warning",
            "message": (
                "🚨 HEAT ADVISORY: Mumbai is experiencing VERY HIGH heat stress (37.2°C, "
                "HTSI: 79/100). Peak thermal intensity expected between 1:00 PM – 4:30 PM. "
                "Stay indoors, drink electrolytes regularly, and avoid direct sun exposure. "
                "Check on elderly neighbors."
            ),
            "actions": [
                "Open All Public Cooling Centers (10 AM - 7 PM)",
                "Halt Non-Essential Strenuous Outdoor Labor",
                "Deploy Mobile Water Tankers to Slum Wards"
            ]
        },
        {
            "alert_id": "alt-del-02",
            "severity": "EXTREME",
            "location": "Delhi NCR",
            "city_id": "delhi",
            "valid_from": now_iso,
            "valid_until": "2026-10-03T19:00:00Z",
            "title": "Severe Heatwave Emergency Alert",
            "message": (
                "⛔ CRITICAL HEAT EMERGENCY: Lethal thermal conditions in Delhi (HTSI: 88/100, Temp: 44.0°C). "
                "Extremely dangerous for human thermoregulation. Seek air-conditioned shelter immediately. "
                "For medical heat distress, dial emergency services immediately."
            ),
            "actions": [
                "Activate Highest Level Heat Disaster Protocol",
                "Operate 24-Hour Continuous Cooling Centers",
                "Mandate Strict Outdoor Labor Moratorium"
            ]
        },
        {
            "alert_id": "alt-ahm-03",
            "severity": "HIGH",
            "location": "Ahmedabad, Gujarat",
            "city_id": "ahmedabad",
            "valid_from": now_iso,
            "valid_until": "2026-10-01T18:00:00Z",
            "title": "High Heat Stress Warning",
            "message": (
                "⚠️ MUNICIPAL DIRECTIVE: Ahmedabad heat-health risk has reached HIGH (68/100). "
                "Action required: Activate Heat Action Plan Level 2, open all designated cooling centers, "
                "and deploy mobile water tankers to high-density wards."
            ),
            "actions": [
                "Issue Orange Heat Warning",
                "Regulate Outdoor Work Hours",
                "Alert Emergency Departments"
            ]
        }
    ]

@router.get("/alerts/templates", summary="Get Predefined Multi-Audience Alert Templates")
async def get_templates():
    return ALERT_TEMPLATES

@router.post("/alerts/preview", summary="Generate Formatted Multi-Channel Notification Preview")
async def preview_alert(req: NotificationPreviewRequest):
    """
    Renders preview text for SMS, WhatsApp, and Email with dynamic parameter substitution.
    """
    rendered = format_alert_message(
        template_key=req.template_key,
        location=req.location,
        severity=req.severity,
        temperature=req.temperature,
        htsi=req.htsi,
        risk_score=req.risk_score,
        peak_time=req.peak_time,
        wbgt=req.wbgt
    )

    return {
        "template_key": req.template_key,
        "location": req.location,
        "severity": req.severity,
        "sms_preview": rendered,
        "whatsapp_preview": f"*ThermalShield Alert*\n\n{rendered}\n\n_Reply STOP to unsubscribe._",
        "email_preview": {
            "subject": f"[{req.severity.upper()} HEAT RISK] {req.location} - ThermalShield Advisory",
            "body": rendered
        }
    }

@router.post("/notifications/sms", summary="Dispatch SMS Heat Alert via Twilio")
async def send_sms_alert(req: SendSMSRequest):
    """
    Sends SMS alert. If Twilio credentials are not configured,
    returns status indicating unconfigured demo preview. Does NOT fake delivery.
    """
    return await notification_service.send_sms(req.recipient, req.message)

@router.post("/notifications/whatsapp", summary="Dispatch WhatsApp Heat Alert via Twilio")
async def send_whatsapp_alert(req: SendWhatsAppRequest):
    """
    Sends WhatsApp alert. Returns unconfigured status if credentials not set.
    """
    return await notification_service.send_whatsapp(req.recipient, req.message)

@router.post("/notifications/email", summary="Dispatch Email Heat Advisory via SMTP")
async def send_email_alert(req: SendEmailRequest):
    """
    Sends SMTP email alert. Returns unconfigured status if SMTP host not set.
    """
    return await notification_service.send_email(req.recipient, req.message, subject=req.subject)

@router.post("/alerts/send", summary="Unified Alert Dispatcher")
async def send_unified_alert(payload: Dict[str, Any]):
    channel = payload.get("channel", "sms").lower()
    recipient = payload.get("recipient", "")
    message = payload.get("message", "")
    subject = payload.get("subject", "ThermalShield Heat-Health Advisory")

    if not recipient or not message:
        raise HTTPException(status_code=400, detail="Recipient and message must be provided.")

    if channel == "sms":
        return await notification_service.send_sms(recipient, message)
    elif channel == "whatsapp":
        return await notification_service.send_whatsapp(recipient, message)
    elif channel == "email":
        return await notification_service.send_email(recipient, message, subject=subject)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported notification channel: {channel}")
