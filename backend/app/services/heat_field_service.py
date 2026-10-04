import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from .location_service import location_service
from ..config import settings
from ..integrations.weather.service import weather_service
from ..engine.thermal.htsi import calculate_htsi

logger = logging.getLogger(__name__)

class HeatFieldService:
    """
    Current heat stress for every monitored city at once, for the national overview.
    """

    def __init__(self):
        self.provider = weather_service.provider
        self._cache: Optional[Dict[str, Any]] = None
        self._cached_at: float = 0.0

    async def get_heat_field(self) -> Dict[str, Any]:
        now = time.time()
        if self._cache and now - self._cached_at < settings.WEATHER_CACHE_TTL_SECONDS:
            return self._cache

        cities = location_service.get_all_locations()
        try:
            currents = await self.provider.get_current_many(
                [(city["latitude"], city["longitude"]) for city in cities]
            )
        except Exception as e:
            logger.warning(f"Heat field weather lookup failed: {e}")
            if self._cache:
                return {**self._cache, "is_live": False, "source": "Cached Open-Meteo API (Expired Cache)"}
            # No fabricated readings: the cities are listed without values.
            return self._build(cities, [None] * len(cities), is_live=False, source="Weather provider unavailable")

        self._cache = self._build(cities, currents, is_live=True, source="Live Open-Meteo API")
        self._cached_at = now
        return self._cache

    def build_live_readings(self, readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        cities = location_service.get_all_locations()
        readings_by_id = {reading["id"]: reading for reading in readings}
        currents = [readings_by_id.get(city["id"]) for city in cities]
        return self._build(cities, currents, is_live=True, source="Live Open-Meteo")

    def _build(
        self,
        cities: List[Dict[str, Any]],
        currents: List[Optional[Dict[str, Any]]],
        is_live: bool,
        source: str
    ) -> Dict[str, Any]:
        entries = []
        for city, current in zip(cities, currents):
            entry = {
                "id": city["id"],
                "city": city["city"],
                "state": city["state"],
                "latitude": city["latitude"],
                "longitude": city["longitude"],
                "temperature_c": None,
                "relative_humidity": None,
                "htsi": None,
                "htsi_category": None
            }
            if current:
                htsi = calculate_htsi(
                    current["temperature_c"],
                    current["relative_humidity"],
                    current["wind_speed_ms"],
                    current["solar_radiation_wm2"]
                )
                entry.update({
                    "temperature_c": round(current["temperature_c"], 1),
                    "relative_humidity": round(current["relative_humidity"]),
                    "htsi": htsi["score"],
                    "htsi_category": htsi["category"]
                })
            entries.append(entry)

        return {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "is_live": is_live,
            "source": source,
            "cities": entries
        }

heat_field_service = HeatFieldService()
