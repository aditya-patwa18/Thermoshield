from abc import ABC, abstractmethod
from typing import Dict, Any

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
