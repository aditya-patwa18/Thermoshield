from fastapi import APIRouter
from typing import Dict, Any
from ..config import settings
from ..schemas import HealthResponse
from ..integrations.notifications.service import notification_service

router = APIRouter(tags=["System Health & Config"])

@router.get("/health", response_model=HealthResponse, summary="Get Live System Status")
async def get_health():
    """
    Returns actual live operational status of backend, weather connection,
    Google Maps configuration, and notification integrations.
    """
    notif_status = notification_service.get_status()
    return {
        "status": "online",
        "version": settings.VERSION,
        "backend_status": "operational",
        "weather_provider": {
            "name": "Open-Meteo",
            "type": "Live Meteorological REST API",
            "status": "connected"
        },
        "maps_configured": settings.is_maps_configured,
        "notifications": notif_status
    }

@router.get("/config", summary="Get Public Application Configuration")
async def get_config() -> Dict[str, Any]:
    """
    Returns safe, non-sensitive application environment status flags.
    """
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "debug": settings.DEBUG,
        "has_google_maps_key": settings.is_maps_configured,
        "has_twilio_sms": settings.is_twilio_configured,
        "has_twilio_whatsapp": settings.is_whatsapp_configured,
        "has_smtp_email": settings.is_smtp_configured,
        "weather_cache_ttl_sec": settings.WEATHER_CACHE_TTL_SECONDS
    }
