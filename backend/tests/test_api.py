import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "weather_provider" in data
    assert "notifications" in data

def test_locations_list():
    res = client.get("/api/locations")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 25
    assert any(loc["id"] == "mumbai" for loc in data)
    assert any(loc["id"] == "delhi" for loc in data)

def test_thermal_endpoint():
    res = client.get("/api/thermal?temperature=38&humidity=60&wind_speed=2.0&solar_radiation=600")
    assert res.status_code == 200
    data = res.json()
    assert "htsi" in data
    assert "wbgt" in data
    assert "utci" in data
    assert "heat_index" in data

def test_mumbai_dashboard():
    res = client.get("/api/dashboard/location/mumbai")
    assert res.status_code == 200
    data = res.json()
    assert "location" in data
    assert "weather" in data
    assert "thermal" in data
    assert "health_risk" in data
    assert "forecast_5d" in data
    assert "hourly_24h" in data
    assert "recommended_actions" in data
    assert "nearby_facilities" in data
    assert data["location"]["id"] == "mumbai"

def test_reverse_geocode():
    # Mumbai coordinates
    res = client.get("/api/geocode?lat=19.0760&lon=72.8777")
    assert res.status_code == 200
    data = res.json()
    assert "name" in data

def test_scenario_simulate():
    payload = {
        "base_temperature_c": 36.0,
        "base_humidity": 65.0,
        "base_wind_speed_ms": 1.8,
        "base_solar_radiation_wm2": 600.0,
        "temp_delta_c": 3.0,
        "humidity_delta_pct": 10.0,
        "wind_delta_ms": -0.5,
        "pvi_score": 60.0
    }
    res = client.post("/api/scenario/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "baseline" in data
    assert "scenario" in data
    assert data["deltas"]["htsi_change"] > 0
