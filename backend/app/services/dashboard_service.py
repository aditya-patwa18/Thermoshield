import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from .location_service import location_service
from .geospatial_service import geospatial_service
from ..integrations.weather.service import weather_service
from ..engine.thermal.htsi import calculate_htsi
from ..engine.vulnerability import calculate_pvi
from ..engine.health_risk import calculate_health_risk
from ..engine.alerts import generate_recommendations, format_alert_message

logger = logging.getLogger(__name__)

class DashboardService:
    async def get_dashboard_data(
        self,
        lat: float,
        lon: float,
        location_id: Optional[str] = None,
        custom_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assembles the comprehensive ThermalShield Intelligence Dashboard payload.
        """
        # 1. Resolve Location & Ward Information
        city_match = None
        if location_id:
            city_match = location_service.get_location_by_id(location_id)
            if city_match:
                lat = city_match["latitude"]
                lon = city_match["longitude"]
        else:
            city_match = location_service.find_closest_location(lat, lon, max_distance_km=45.0)

        # Check Ward (Point-in-polygon)
        ward_props = geospatial_service.get_ward_for_coordinate(lat, lon)

        # Determine location metadata
        loc_name = custom_name
        state_name = "Global Region"
        country_name = "Global"
        city_id = city_match["id"] if city_match else "custom"

        if ward_props:
            loc_name = f"{ward_props.get('ward_name')} (Mumbai)"
            state_name = "Maharashtra"
            country_name = "India"
        elif city_match:
            loc_name = f"{city_match['city']}, {city_match['state']}"
            state_name = city_match["state"]
            country_name = city_match["country"]
        elif not loc_name:
            loc_name = f"Location ({lat:.4f}, {lon:.4f})"

        is_covered_indian = bool(city_match or ward_props or location_service.is_in_india_bounds(lat, lon))

        # 2. Fetch Meteorological Forecast Data
        city_hint = city_match["id"] if city_match else ("mumbai" if ward_props else None)
        weather_payload = await weather_service.get_forecast(lat, lon, days=5, city_hint=city_hint)
        current_w = weather_payload["current"]

        # 3. Calculate Thermal Stress Engine Metrics
        temp_c = current_w.get("temperature_c", 35.0)
        rh = current_w.get("relative_humidity", 55.0)
        wind_ms = current_w.get("wind_speed_ms", 1.8)
        solar_rad = current_w.get("solar_radiation_wm2", 500.0)

        htsi_data = calculate_htsi(temp_c, rh, wind_ms, solar_rad)

        # 4. Resolve Vulnerability Data
        has_vulnerability_data = False
        vulnerability_notice = None

        if ward_props:
            # High-resolution Ward Demographics
            demographics = {
                "population": ward_props.get("population", 500000),
                "population_density": ward_props.get("population_density", 35000),
                "elderly_percent": ward_props.get("elderly_percent", 9.5),
                "children_percent": ward_props.get("children_percent", 8.0),
                "outdoor_worker_percent": ward_props.get("outdoor_worker_percent", 35.0),
                "poverty_rate": 25.0
            }
            infrastructure = {
                "cooling_centers": ward_props.get("cooling_centers", 3),
                "hospitals": ward_props.get("hospitals", 6),
                "water_points": ward_props.get("water_points", 15)
            }
            vulnerability_data = calculate_pvi(demographics, infrastructure)
            has_vulnerability_data = True
            vulnerability_data["source"] = "Mumbai Ward Prototype Dataset"
            vulnerability_data["ward_id"] = ward_props.get("ward_id")
            vulnerability_data["ward_name"] = ward_props.get("ward_name")
        elif city_match and "demographics" in city_match:
            # City-level Demographics
            demographics = city_match["demographics"]
            demographics["population"] = city_match.get("population", 1000000)
            infrastructure = city_match.get("infrastructure", {})
            vulnerability_data = calculate_pvi(demographics, infrastructure)
            has_vulnerability_data = True
            vulnerability_data["source"] = "Predefined Indian Cities Dataset"
        else:
            # Global baseline without fabricated demographics (Section 6)
            vulnerability_data = {
                "score": 40.0,
                "category": "Baseline",
                "summary": "Baseline exposure estimate applied for global coordinates.",
                "drivers": ["Standard global municipal baseline assumption"],
                "components": {}
            }
            vulnerability_notice = (
                "Thermal analysis is available globally. Population-health vulnerability and prototype "
                "heat-health risk coverage is currently available for selected Indian locations."
            )

        vulnerability_data["has_coverage"] = has_vulnerability_data
        vulnerability_data["coverage_notice"] = vulnerability_notice

        # 5. Calculate Prototype Health Risk
        pvi_score = vulnerability_data["score"]
        daily_forecast = weather_payload.get("daily", [])
        consecutive_hot_days = 0
        for d in daily_forecast:
            if d.get("temp_max", 0) >= 38.0:
                consecutive_hot_days += 1
            else:
                break
        consecutive_hot_days = max(1, consecutive_hot_days)

        min_temp = daily_forecast[0].get("temp_min", temp_c - 7.0) if daily_forecast else temp_c - 7.0

        health_risk_data = calculate_health_risk(
            htsi_score=htsi_data["score"],
            pvi_score=pvi_score,
            max_temperature=temp_c,
            min_temperature=min_temp,
            consecutive_hot_days=consecutive_hot_days
        )

        # 6. Evaluate 5-Day Forecast with Thermal & Risk Metrics
        forecast_5d = []
        for d in daily_forecast:
            d_max = d.get("temp_max", temp_c)
            d_min = d.get("temp_min", min_temp)
            d_wind = d.get("wind_speed_max_ms", wind_ms)
            d_rad = d.get("solar_radiation_max", solar_rad)
            d_rh = d.get("humidity_avg", rh)

            d_htsi = calculate_htsi(d_max, d_rh, d_wind, d_rad)
            d_risk = calculate_health_risk(
                htsi_score=d_htsi["score"],
                pvi_score=pvi_score,
                max_temperature=d_max,
                min_temperature=d_min,
                consecutive_hot_days=consecutive_hot_days
            )
            forecast_5d.append({
                "date": d.get("date"),
                "temp_max": round(d_max, 1),
                "temp_min": round(d_min, 1),
                "humidity_avg": round(d_rh, 0),
                "wind_speed_ms": round(d_wind, 1),
                "htsi_score": d_htsi["score"],
                "htsi_category": d_htsi["category"],
                "wbgt": d_htsi["sub_indices"]["wbgt"]["value"],
                "utci": d_htsi["sub_indices"]["utci"]["value"],
                "heat_index": d_htsi["sub_indices"]["heat_index"]["value"],
                "risk_score": d_risk["risk_score"],
                "risk_category": d_risk["category"],
                "color": d_risk["color"]
            })

        # 7. Evaluate 24-Hour Forecast & Peak Risk Period
        hourly_24h = []
        peak_temp = -999.0
        peak_hour = "14:00"
        peak_htsi = 0.0

        for h in weather_payload.get("hourly_24h", []):
            h_temp = h.get("temperature_c", temp_c)
            h_rh = h.get("relative_humidity", rh)
            h_wind = h.get("wind_speed_ms", wind_ms)
            h_rad = h.get("solar_radiation_wm2", solar_rad)

            h_htsi = calculate_htsi(h_temp, h_rh, h_wind, h_rad)
            if h_htsi["score"] > peak_htsi:
                peak_htsi = h_htsi["score"]
                peak_temp = h_temp
                peak_hour = h.get("hour", "14:00")

            hourly_24h.append({
                "hour": h.get("hour"),
                "time": h.get("time"),
                "temperature_c": round(h_temp, 1),
                "relative_humidity": round(h_rh, 0),
                "wind_speed_ms": round(h_wind, 1),
                "solar_radiation_wm2": round(h_rad, 0),
                "htsi_score": h_htsi["score"],
                "wbgt": h_htsi["sub_indices"]["wbgt"]["value"],
                "utci": h_htsi["sub_indices"]["utci"]["value"]
            })

        peak_window = f"{peak_hour} – {int(peak_hour.split(':')[0]) + 3:02d}:00" if ":" in peak_hour else "13:00 – 16:30"

        # 8. Dynamic Recommendations
        recommendations = generate_recommendations(
            risk_category=health_risk_data["category"],
            vulnerability_score=pvi_score,
            infrastructure_deficit=vulnerability_data.get("components", {}).get("infrastructure_deficit", 35.0),
            consecutive_days=consecutive_hot_days
        )

        # 9. Active Alerts
        active_alerts = []
        if health_risk_data["risk_score"] >= 45.0:
            now_iso = datetime.now(timezone.utc).isoformat()
            wbgt_val = htsi_data["sub_indices"]["wbgt"]["value"]
            active_alerts.append({
                "alert_id": f"alt-{city_id}-01",
                "severity": health_risk_data["category"].upper(),
                "location": loc_name,
                "valid_from": now_iso,
                "title": f"{health_risk_data['category']} Heat Risk Warning",
                "message": format_alert_message(
                    "public_warning",
                    loc_name,
                    health_risk_data["category"],
                    temp_c,
                    htsi_data["score"],
                    health_risk_data["risk_score"],
                    peak_time=peak_window,
                    wbgt=wbgt_val
                ),
                "actions": [r["title"] for r in recommendations[:3]]
            })

        # 10. Nearest Facilities
        nearest_facilities = geospatial_service.get_nearest_facilities(lat, lon)

        return {
            "location": {
                "id": city_id,
                "name": loc_name,
                "state": state_name,
                "country": country_name,
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "is_indian_covered": is_covered_indian,
                "ward": ward_props
            },
            "weather": {
                "current": current_w,
                "source": weather_payload.get("source", "Live Open-Meteo"),
                "is_live": weather_payload.get("is_live", True)
            },
            "thermal": {
                "htsi": htsi_data["score"],
                "htsi_category": htsi_data["category"],
                "htsi_summary": htsi_data["summary"],
                "htsi_color": htsi_data["color"],
                "heat_index": htsi_data["sub_indices"]["heat_index"],
                "wet_bulb": htsi_data["sub_indices"]["wet_bulb"],
                "wbgt": htsi_data["sub_indices"]["wbgt"],
                "utci": htsi_data["sub_indices"]["utci"],
                "components": htsi_data["components"]
            },
            "vulnerability": vulnerability_data,
            "health_risk": health_risk_data,
            "forecast_5d": forecast_5d,
            "hourly_24h": hourly_24h,
            "peak_risk_period": {
                "window": peak_window,
                "peak_temperature_c": round(peak_temp if peak_temp > -900 else temp_c, 1),
                "peak_htsi": round(peak_htsi if peak_htsi > 0 else htsi_data["score"], 1)
            },
            "risk_drivers": htsi_data["driver_scores"],
            "primary_explanations": htsi_data["primary_drivers"],
            "recommended_actions": recommendations,
            "alerts": active_alerts,
            "nearby_facilities": nearest_facilities,
            "metadata": {
                "weather_source": weather_payload.get("source", "Live Open-Meteo"),
                "health_model": "rule_based_prototype",
                "is_live_weather": weather_payload.get("is_live", True),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }

dashboard_service = DashboardService()
