from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple

class WeatherProvider(ABC):
    """
    Abstract interface for weather providers.
    Allows easy addition of other providers (e.g. OpenWeather, Tomorrow.io, IMD) in the future.
    """

    @abstractmethod
    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Retrieves current weather conditions for given coordinates.
        """
        raise NotImplementedError

    @abstractmethod
    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
        """
        Retrieves multi-day hourly and daily forecast data for given coordinates.
        """
        raise NotImplementedError

    async def get_current_many(self, coords: List[Tuple[float, float]]) -> List[Dict[str, Any]]:
        """
        Retrieves current conditions for several (lat, lon) points, in the same order.
        Providers with a bulk endpoint should override this.
        """
        return [await self.get_current_weather(lat, lon) for lat, lon in coords]
