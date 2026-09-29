from fastapi import APIRouter, Query
from ..engine.health_risk import calculate_health_risk
from ..engine.thermal.htsi import calculate_htsi
from ..integrations.weather.service import weather_service
from ..services.location_service import location_service

router = APIRouter(tags=["Health Risk Engine"])

@router.get("/risk", summary="Calculate Prototype Heat-Health Risk Score")
async def get_risk(
    htsi: float = Query(65.0, ge=0, le=100, description="HTSI Score (0-100)"),
    pvi: float = Query(50.0, ge=0, le=100, description="Population Vulnerability Index (0-100)"),
    max_temp: float = Query(38.0, description="Maximum daytime temperature (°C)"),
    min_temp: float = Query(28.0, description="Minimum night-time temperature (°C)"),
    consecutive_days: int = Query(2, ge=1, description="Consecutive hot days")
):
    """
    Computes Prototype Heat-Health Risk using the transparent rule-based prototype engine.
    """
    return calculate_health_risk(
        htsi_score=htsi,
        pvi_score=pvi,
        max_temperature=max_temp,
        min_temperature=min_temp,
        consecutive_hot_days=consecutive_days
    )

@router.get("/forecast-risk", summary="Get 5-Day Heat-Health Risk Outlook for Location")
async def get_forecast_risk(
    city_id: str = Query("mumbai", description="Monitored City ID"),
    lat: float = Query(19.0760, ge=-90, le=90, description="Latitude"),
    lon: float = Query(72.8777, ge=-180, le=180, description="Longitude")
):
    loc = location_service.get_location_by_id(city_id)
    if loc:
        lat, lon = loc["latitude"], loc["longitude"]

    weather = await weather_service.get_forecast(lat, lon, days=5, city_hint=city_id)
    daily = weather.get("daily", [])

    results = []
    pvi = 60.0  # default
    if loc and "demographics" in loc:
        pvi = 68.0

    for idx, d in enumerate(daily):
        t_max = d.get("temp_max", 36.0)
        t_min = d.get("temp_min", 26.0)
        w_ms = d.get("wind_speed_max_ms", 2.0)
        htsi_res = calculate_htsi(t_max, 65.0, w_ms, 700.0)
        risk_res = calculate_health_risk(
            htsi_score=htsi_res["score"],
            pvi_score=pvi,
            max_temperature=t_max,
            min_temperature=t_min,
            consecutive_hot_days=idx + 1
        )
        results.append({
            "date": d.get("date"),
            "max_temp": t_max,
            "min_temp": t_min,
            "htsi": htsi_res["score"],
            "risk_score": risk_res["risk_score"],
            "risk_category": risk_res["category"],
            "color": risk_res["color"]
        })

    return {
        "city_id": city_id,
        "forecast_days": len(results),
        "daily_risk": results
    }
