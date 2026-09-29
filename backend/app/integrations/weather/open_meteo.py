import httpx
from typing import Dict, Any
from .base import WeatherProvider

class OpenMeteoProvider(WeatherProvider):
    """
    Open-Meteo weather integration.
    Provides live global meteorological forecasts without requiring paid API keys.
    """
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, timeout: float = 8.0):
        self.timeout = timeout

    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "dew_point_2m",
                "surface_pressure",
                "cloud_cover",
                "wind_speed_10m",
                "wind_direction_10m",
                "direct_normal_irradiance"
            ],
            "timezone": "auto"
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 25.0))
        wind_kmh = float(current.get("wind_speed_10m", 5.0))
        wind_ms = round(wind_kmh / 3.6, 2)
        rad = float(current.get("direct_normal_irradiance", 300.0) or 0.0)
        rh = float(current.get("relative_humidity_2m", 50.0))

        return {
            "temperature_c": temp,
            "relative_humidity": rh,
            "wind_speed_kmh": round(wind_kmh, 1),
            "wind_speed_ms": wind_ms,
            "wind_direction_deg": int(current.get("wind_direction_10m", 0) or 0),
            "solar_radiation_wm2": round(rad, 1),
            "cloud_cover_percent": int(current.get("cloud_cover_percent", current.get("cloud_cover", 0)) or 0),
            "surface_pressure_hpa": round(float(current.get("surface_pressure", 1013.2) or 1013.2), 1),
            "dew_point_c": round(float(current.get("dew_point_2m", temp - ((100.0 - rh) / 5.0)) or 20.0), 1),
            "timestamp": current.get("time", ""),
            "provider": "Open-Meteo"
        }

    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "forecast_days": days,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "dew_point_2m",
                "surface_pressure",
                "cloud_cover",
                "wind_speed_10m",
                "wind_direction_10m",
                "direct_normal_irradiance"
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "direct_normal_irradiance",
                "surface_pressure",
                "dew_point_2m"
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "wind_speed_10m_max",
                "daylight_duration"
            ],
            "timezone": "auto"
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

        # Parse current
        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 25.0))
        wind_kmh = float(current.get("wind_speed_10m", 5.0))
        wind_ms = round(wind_kmh / 3.6, 2)
        rad = float(current.get("direct_normal_irradiance", 350.0) or 0.0)
        rh = float(current.get("relative_humidity_2m", 50.0))

        current_dict = {
            "temperature_c": temp,
            "relative_humidity": rh,
            "wind_speed_kmh": round(wind_kmh, 1),
            "wind_speed_ms": wind_ms,
            "wind_direction_deg": int(current.get("wind_direction_10m", 0) or 0),
            "solar_radiation_wm2": round(rad, 1),
            "cloud_cover_percent": int(current.get("cloud_cover_percent", current.get("cloud_cover", 0)) or 0),
            "surface_pressure_hpa": round(float(current.get("surface_pressure", 1013.2) or 1013.2), 1),
            "dew_point_c": round(float(current.get("dew_point_2m", 20.0) or 20.0), 1),
            "timestamp": current.get("time", ""),
            "provider": "Open-Meteo"
        }

        # Parse daily
        daily_raw = data.get("daily", {})
        dates = daily_raw.get("time", [])
        t_maxs = daily_raw.get("temperature_2m_max", [])
        t_mins = daily_raw.get("temperature_2m_min", [])
        w_maxs = daily_raw.get("wind_speed_10m_max", [])

        daily_list = []
        for i in range(min(days, len(dates))):
            daily_list.append({
                "date": dates[i],
                "temp_max": float(t_maxs[i]) if i < len(t_maxs) else temp + 2.0,
                "temp_min": float(t_mins[i]) if i < len(t_mins) else temp - 6.0,
                "wind_speed_max_kmh": float(w_maxs[i]) if i < len(w_maxs) else 10.0,
                "wind_speed_max_ms": round((float(w_maxs[i]) if i < len(w_maxs) else 10.0) / 3.6, 2)
            })

        # Parse hourly (next 24 hours)
        hourly_raw = data.get("hourly", {})
        h_times = hourly_raw.get("time", [])
        h_temps = hourly_raw.get("temperature_2m", [])
        h_rhs = hourly_raw.get("relative_humidity_2m", [])
        h_winds = hourly_raw.get("wind_speed_10m", [])
        h_rads = hourly_raw.get("direct_normal_irradiance", [])

        hourly_24h = []
        for i in range(min(24, len(h_times))):
            w_ms = round((float(h_winds[i]) if i < len(h_winds) and h_winds[i] is not None else 5.0) / 3.6, 2)
            rad_val = float(h_rads[i]) if i < len(h_rads) and h_rads[i] is not None else 0.0
            hourly_24h.append({
                "time": h_times[i],
                "hour": h_times[i].split("T")[1][:5] if "T" in h_times[i] else h_times[i],
                "temperature_c": float(h_temps[i]) if i < len(h_temps) else temp,
                "relative_humidity": float(h_rhs[i]) if i < len(h_rhs) else rh,
                "wind_speed_ms": w_ms,
                "solar_radiation_wm2": round(rad_val, 1)
            })

        return {
            "current": current_dict,
            "daily": daily_list,
            "hourly_24h": hourly_24h,
            "source": "Live Open-Meteo API",
            "is_live": True
        }
