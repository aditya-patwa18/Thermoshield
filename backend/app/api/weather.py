from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..integrations.weather.service import weather_service
from ..services.location_service import location_service

router = APIRouter(tags=["Weather Services"])

@router.get("/weather", summary="Get Current Weather Conditions")
async def get_current_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    city: Optional[str] = Query(None, description="Monitored City ID, e.g. mumbai, delhi")
):
    """
    Fetches real-time weather conditions from Open-Meteo API or fallback cache.
    """
    if city:
        loc = location_service.get_location_by_id(city)
        if loc:
            lat = loc["latitude"]
            lon = loc["longitude"]
    if lat is None or lon is None:
        # Default to Mumbai if neither provided
        lat, lon = 19.0760, 72.8777
        city = "mumbai"

    data = await weather_service.get_forecast(lat, lon, days=1, city_hint=city)
    return {
        "current": data["current"],
        "source": data.get("source"),
        "is_live": data.get("is_live", True),
        "latitude": lat,
        "longitude": lon
    }

@router.get("/weather/forecast", summary="Get 5-Day Multi-Variable Meteorological Forecast")
async def get_weather_forecast(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(5, ge=1, le=7, description="Forecast duration in days"),
    city: Optional[str] = Query(None, description="Monitored City ID")
):
    """
    Returns 5-day daily forecast and 24-hour hourly meteorological progression.
    """
    if city:
        loc = location_service.get_location_by_id(city)
        if loc:
            lat = loc["latitude"]
            lon = loc["longitude"]
    if lat is None or lon is None:
        lat, lon = 19.0760, 72.8777
        city = "mumbai"

    return await weather_service.get_forecast(lat, lon, days=days, city_hint=city)
