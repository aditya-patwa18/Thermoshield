import pytest
from app.engine.health_risk import calculate_health_risk
from app.engine.vulnerability import calculate_pvi

def test_vulnerability_pvi():
    demo = {
        "population": 5000000,
        "population_density": 25000,
        "elderly_percent": 11.0,
        "children_percent": 8.0,
        "outdoor_worker_percent": 40.0,
        "poverty_rate": 28.0
    }
    infra = {
        "cooling_centers": 5,
        "hospitals": 12,
        "water_points": 25
    }
    pvi = calculate_pvi(demo, infra)
    assert 0 <= pvi["score"] <= 100
    assert pvi["category"] in ["High", "Very High", "Extreme"]
    assert len(pvi["drivers"]) > 0

def test_risk_scaling_with_temperature():
    low_risk = calculate_health_risk(htsi_score=20.0, pvi_score=30.0, max_temperature=26.0, min_temperature=18.0)
    high_risk = calculate_health_risk(htsi_score=85.0, pvi_score=75.0, max_temperature=44.0, min_temperature=31.0, consecutive_hot_days=3)

    assert low_risk["risk_score"] < high_risk["risk_score"]
    assert low_risk["category"] in ["Low", "Moderate"]
    assert high_risk["category"] in ["Very High", "Extreme"]
    assert "Simulation score" in high_risk["disclaimer"]

def test_vulnerability_magnifies_risk():
    risk_low_vuln = calculate_health_risk(htsi_score=70.0, pvi_score=20.0, max_temperature=38.0, min_temperature=25.0)
    risk_high_vuln = calculate_health_risk(htsi_score=70.0, pvi_score=85.0, max_temperature=38.0, min_temperature=25.0)

    assert risk_high_vuln["risk_score"] > risk_low_vuln["risk_score"]
