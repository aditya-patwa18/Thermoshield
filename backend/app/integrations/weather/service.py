import json
import time
import logging
from typing import Dict, Any, Optional
from ...config import settings, DATA_DIR
from .base import WeatherProvider
from .open_meteo import OpenMeteoProvider

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self, provider: Optional[WeatherProvider] = None):
        self.provider = provider or OpenMeteoProvider()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = settings.WEATHER_CACHE_TTL_SECONDS
        self._fallback_data = self._load_fallback_data()

    def _load_fallback_data(self) -> Dict[str, Any]:
        fallback_file = DATA_DIR / "fallback_weather.json"
        if fallback_file.exists():
            try:
                with open(fallback_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load fallback weather: {e}")
        return {}

    def _cache_key(self, lat: float, lon: float, days: int) -> str:
        return f"{round(lat, 2)}_{round(lon, 2)}_{days}"

    async def get_forecast(self, lat: float, lon: float, days: int = 5, city_hint: Optional[str] = None) -> Dict[str, Any]:
        key = self._cache_key(lat, lon, days)
        now = time.time()

        # Check Cache
        if key in self._cache:
            entry = self._cache[key]
            if now - entry["timestamp"] < self._cache_ttl:
                cached_res = dict(entry["data"])
                cached_res["source"] = "Cached Open-Meteo API"
                cached_res["is_live"] = True
                cached_res["cached_at"] = entry["timestamp"]
                return cached_res

        # Try Live Provider
        try:
            forecast = await self.provider.get_forecast(lat, lon, days)
            self._cache[key] = {
                "timestamp": now,
                "data": forecast
            }
            return forecast
        except Exception as e:
            logger.warning(f"Live weather API failed for lat={lat}, lon={lon}: {e}. Falling back...")

            # If cache has expired data, prefer it over generic fallback
            if key in self._cache:
                expired = dict(self._cache[key]["data"])
                expired["source"] = "Cached Open-Meteo API (Expired Cache)"
                expired["is_live"] = False
                return expired

            # Use Predefined Prototype Fallback
            return self._get_fallback_forecast(lat, lon, city_hint)

    def _get_fallback_forecast(self, lat: float, lon: float, city_hint: Optional[str] = None) -> Dict[str, Any]:
        hint = (city_hint or "").lower().strip()
        matched = None

        if hint in self._fallback_data:
            matched = self._fallback_data[hint]
        elif "mumbai" in self._fallback_data:
            # Default to Mumbai if no specific city matches
            matched = self._fallback_data["mumbai"]

        if matched:
            return {
                "current": matched["current"],
                "daily": matched["daily"],
                "hourly_24h": matched["hourly_24h"],
                "source": "Prototype Fallback Dataset",
                "is_live": False,
                "is_fallback": True
            }

        # Absolute minimum emergency fallback
        return {
            "current": {
                "temperature_c": 35.0,
                "relative_humidity": 65.0,
                "wind_speed_kmh": 7.2,
                "wind_speed_ms": 2.0,
                "wind_direction_deg": 240,
                "solar_radiation_wm2": 650.0,
                "cloud_cover_percent": 20,
                "surface_pressure_hpa": 1010.0,
                "dew_point_c": 27.0,
                "timestamp": ""
            },
            "daily": [],
            "hourly_24h": [],
            "source": "Prototype Fallback Dataset",
            "is_live": False,
            "is_fallback": True
        }

weather_service = WeatherService()
