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


# --- Input validation & error handling ---

@pytest.mark.parametrize("path", [
    "/api/geocode?lat=999&lon=72.87",
    "/api/geocode?lat=19&lon=-181",
    "/api/dashboard?lat=200&lon=77.2",
    "/api/dashboard?lat=20&lon=400",
    "/api/weather?lat=91&lon=0",
    "/api/infrastructure/nearest?lat=-91&lon=0",
    "/api/thermal?temperature=40&humidity=150",
    "/api/wbgt?temperature=40&humidity=-5",
    "/api/utci?temperature=40&wind_speed=-1",
    "/api/htsi?temperature=40&solar_radiation=-10",
])
def test_out_of_range_query_params_rejected(path):
    assert client.get(path).status_code == 422


def test_unknown_location_returns_404():
    assert client.get("/api/dashboard/location/atlantis").status_code == 404
    assert client.get("/api/locations/atlantis").status_code == 404


def test_dashboard_by_coordinates():
    res = client.get("/api/dashboard?lat=28.6&lon=77.2&name=Test%20Point")
    assert res.status_code == 200
    assert res.json()["location"]["latitude"] == 28.6


def test_scenario_rejects_out_of_range_inputs():
    base = {"base_humidity": 60.0, "pvi_score": 50.0}
    assert client.post("/api/scenario/simulate", json={**base, "base_humidity": 500}).status_code == 422
    assert client.post("/api/scenario/simulate", json={**base, "pvi_score": -1}).status_code == 422
    assert client.post("/api/scenario/simulate", json={**base, "base_wind_speed_ms": -3}).status_code == 422


def test_interventions_reject_out_of_range_inputs():
    assert client.post("/api/scenario/interventions", json={"water_points_deployed": -5}).status_code == 422
    assert client.post("/api/scenario/interventions", json={"capacity_expansion_percent": 10000}).status_code == 422
    ok = client.post("/api/scenario/interventions", json={"water_points_deployed": 5})
    assert ok.status_code == 200


def test_alert_preview_and_unknown_template():
    good = client.post("/api/alerts/preview", json={"template_key": "public_warning", "location": "Mumbai"})
    assert good.status_code == 200
    assert "Mumbai" in good.json()["sms_preview"]
    assert client.post("/api/alerts/preview", json={"template_key": "bogus"}).status_code == 404


@pytest.mark.parametrize("payload,status", [
    ({"channel": "pigeon", "recipient": "x", "message": "hi"}, 422),
    ({"channel": "sms", "recipient": "notaphone", "message": "hi"}, 400),
    ({"channel": "whatsapp", "recipient": "12", "message": "hi"}, 400),
    ({"channel": "email", "recipient": "no-at-sign", "message": "hi"}, 400),
    ({"channel": "sms", "recipient": "+919876543210", "message": "   "}, 400),
    ({"channel": "sms", "recipient": "", "message": "hi"}, 422),
    ({"channel": "sms", "message": "hi"}, 422),
])
def test_alert_send_validation(payload, status):
    assert client.post("/api/alerts/send", json=payload).status_code == status


@pytest.mark.parametrize("payload", [
    {"channel": "sms", "recipient": "+91 98765 43210", "message": "Stay hydrated"},
    {"channel": "whatsapp", "recipient": "+919876543210", "message": "Stay hydrated"},
    {"channel": "email", "recipient": "officer@example.gov.in", "message": "Advisory", "subject": "Heat"},
])
def test_alert_send_valid_payloads_dispatch_to_service(payload, monkeypatch):
    # Never hit real providers (Twilio/SMTP may be configured in a local .env): stub the service.
    from app.api import alerts as alerts_api

    calls = []

    async def fake(recipient, message, **kwargs):
        calls.append((recipient, message))
        return {"success": True, "status": "stubbed"}

    for name in ("send_sms", "send_whatsapp", "send_email"):
        monkeypatch.setattr(alerts_api.notification_service, name, fake)

    res = client.post("/api/alerts/send", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "stubbed"
    assert calls == [(payload["recipient"], payload["message"])]


# --- National heat field (feeds the 3D overview) ---

def test_heat_field_reports_heat_stress_for_every_monitored_city(monkeypatch):
    from app.services.heat_field_service import heat_field_service

    async def fake_current_many(coords):
        return [
            {"temperature_c": 30.0 + i % 12, "relative_humidity": 60.0, "wind_speed_ms": 2.0, "solar_radiation_wm2": 500.0}
            for i, _ in enumerate(coords)
        ]

    monkeypatch.setattr(heat_field_service.provider, "get_current_many", fake_current_many)
    monkeypatch.setattr(heat_field_service, "_cache", None)

    data = client.get("/api/heat-field").json()
    assert data["is_live"] is True
    assert len(data["cities"]) >= 25
    mumbai = next(c for c in data["cities"] if c["id"] == "mumbai")
    assert mumbai["temperature_c"] == 30.0
    assert 0 <= mumbai["htsi"] <= 100
    assert mumbai["htsi_category"] in {"Low", "Moderate", "High", "Very High", "Extreme"}
    assert {"city", "state", "latitude", "longitude", "relative_humidity"} <= mumbai.keys()


def test_heat_field_does_not_invent_values_when_weather_is_unavailable(monkeypatch):
    from app.services.heat_field_service import heat_field_service

    async def failing_current_many(coords):
        raise RuntimeError("weather provider down")

    monkeypatch.setattr(heat_field_service.provider, "get_current_many", failing_current_many)
    monkeypatch.setattr(heat_field_service, "_cache", None)

    res = client.get("/api/heat-field")
    assert res.status_code == 200
    data = res.json()
    assert data["is_live"] is False
    assert len(data["cities"]) >= 25
    assert all(c["htsi"] is None and c["temperature_c"] is None for c in data["cities"])
