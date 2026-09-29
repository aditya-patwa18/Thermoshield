from typing import Dict, Any
from .thermal.htsi import calculate_htsi
from .health_risk import calculate_health_risk

def simulate_thermal_scenario(
    base_temperature_c: float,
    base_humidity: float,
    base_wind_speed_ms: float,
    base_solar_radiation_wm2: float,
    temp_delta_c: float = 0.0,
    humidity_delta_pct: float = 0.0,
    wind_delta_ms: float = 0.0,
    solar_radiation_override_wm2: float = None,
    pvi_score: float = 50.0
) -> Dict[str, Any]:
    """
    Simulates a 'What-If' environmental scenario and compares baseline vs adjusted metrics.
    """
    # 1. Calculate Baseline
    base_htsi = calculate_htsi(
        base_temperature_c,
        base_humidity,
        base_wind_speed_ms,
        base_solar_radiation_wm2
    )
    base_risk = calculate_health_risk(
        htsi_score=base_htsi["score"],
        pvi_score=pvi_score,
        max_temperature=base_temperature_c,
        min_temperature=max(15.0, base_temperature_c - 9.0)
    )

    # 2. Scenario Inputs
    scen_temp = max(-10.0, min(55.0, base_temperature_c + temp_delta_c))
    scen_humidity = max(5.0, min(100.0, base_humidity + humidity_delta_pct))
    scen_wind = max(0.1, min(25.0, base_wind_speed_ms + wind_delta_ms))
    scen_radiation = (
        solar_radiation_override_wm2
        if solar_radiation_override_wm2 is not None
        else base_solar_radiation_wm2
    )

    # 3. Calculate Scenario
    scen_htsi = calculate_htsi(
        scen_temp,
        scen_humidity,
        scen_wind,
        scen_radiation
    )
    scen_risk = calculate_health_risk(
        htsi_score=scen_htsi["score"],
        pvi_score=pvi_score,
        max_temperature=scen_temp,
        min_temperature=max(15.0, scen_temp - 9.0)
    )

    return {
        "scenario_type": "Environmental 'What-If' Microclimate Simulation",
        "inputs": {
            "baseline": {
                "temperature_c": round(base_temperature_c, 1),
                "relative_humidity": round(base_humidity, 1),
                "wind_speed_ms": round(base_wind_speed_ms, 1),
                "solar_radiation_wm2": round(base_solar_radiation_wm2, 1)
            },
            "scenario": {
                "temperature_c": round(scen_temp, 1),
                "relative_humidity": round(scen_humidity, 1),
                "wind_speed_ms": round(scen_wind, 1),
                "solar_radiation_wm2": round(scen_radiation, 1),
                "temp_delta": round(temp_delta_c, 1),
                "humidity_delta": round(humidity_delta_pct, 1),
                "wind_delta": round(wind_delta_ms, 1)
            }
        },
        "baseline": {
            "htsi": base_htsi["score"],
            "htsi_category": base_htsi["category"],
            "wbgt": base_htsi["sub_indices"]["wbgt"]["value"],
            "utci": base_htsi["sub_indices"]["utci"]["value"],
            "heat_index": base_htsi["sub_indices"]["heat_index"]["value"],
            "health_risk": base_risk["risk_score"],
            "risk_category": base_risk["category"]
        },
        "scenario": {
            "htsi": scen_htsi["score"],
            "htsi_category": scen_htsi["category"],
            "wbgt": scen_htsi["sub_indices"]["wbgt"]["value"],
            "utci": scen_htsi["sub_indices"]["utci"]["value"],
            "heat_index": scen_htsi["sub_indices"]["heat_index"]["value"],
            "health_risk": scen_risk["risk_score"],
            "risk_category": scen_risk["category"]
        },
        "deltas": {
            "htsi_change": round(scen_htsi["score"] - base_htsi["score"], 1),
            "wbgt_change": round(scen_htsi["sub_indices"]["wbgt"]["value"] - base_htsi["sub_indices"]["wbgt"]["value"], 1),
            "utci_change": round(scen_htsi["sub_indices"]["utci"]["value"] - base_htsi["sub_indices"]["utci"]["value"], 1),
            "health_risk_change": round(scen_risk["risk_score"] - base_risk["risk_score"], 1)
        },
        "drivers_shift": scen_htsi["primary_drivers"],
        "disclaimer": "Operational simulation based on thermodynamic approximations. Designed for scenario exploration and resilience planning."
    }

def simulate_administrative_actions(
    base_pvi_score: float,
    current_risk_score: float,
    cooling_centers_active: bool = False,
    capacity_expansion_percent: float = 0.0,
    outdoor_work_shifted: bool = False,
    public_alert_issued: bool = False,
    water_points_deployed: int = 0
) -> Dict[str, Any]:
    """
    Simulates operational heat action interventions.
    Demonstrates coverage and exposure mitigation across administrative levers.
    """
    exposure_mitigation = 0.0
    coverage_improvements = []

    if cooling_centers_active:
        exposure_mitigation += 12.0
        coverage_improvements.append("Designated community shelters providing active thermal relief")

    if capacity_expansion_percent > 0:
        boost = min(15.0, capacity_expansion_percent * 0.15)
        exposure_mitigation += boost
        coverage_improvements.append(f"Shelter bed and hydration capacity expanded by {capacity_expansion_percent}%")

    if outdoor_work_shifted:
        exposure_mitigation += 18.0
        coverage_improvements.append("Work hours shifted away from peak solar radiation (11:30 AM - 4:00 PM)")

    if public_alert_issued:
        exposure_mitigation += 8.0
        coverage_improvements.append("Mass SMS/WhatsApp civic broadcasts reducing elective afternoon transit")

    if water_points_deployed > 0:
        water_effect = min(12.0, water_points_deployed * 0.6)
        exposure_mitigation += water_effect
        coverage_improvements.append(f"{water_points_deployed} mobile emergency water points deployed in high-density areas")

    simulated_vulnerability = max(10.0, base_pvi_score - exposure_mitigation * 0.7)
    simulated_operational_risk = max(10.0, current_risk_score - exposure_mitigation)

    return {
        "intervention_type": "Civic Heat Action Plan (HAP) Operational Simulation",
        "applied_interventions": {
            "cooling_centers_active": cooling_centers_active,
            "capacity_expansion_percent": capacity_expansion_percent,
            "outdoor_work_shifted": outdoor_work_shifted,
            "public_alert_issued": public_alert_issued,
            "water_points_deployed": water_points_deployed
        },
        "results": {
            "baseline_vulnerability": round(base_pvi_score, 1),
            "simulated_vulnerability": round(simulated_vulnerability, 1),
            "vulnerability_mitigation": round(base_pvi_score - simulated_vulnerability, 1),
            "baseline_risk": round(current_risk_score, 1),
            "simulated_operational_risk": round(simulated_operational_risk, 1),
            "risk_mitigation": round(current_risk_score - simulated_operational_risk, 1),
            "coverage_improvements": coverage_improvements
        },
        "disclaimer": "Operational response scenario illustrating population exposure shifts. Not an empirical clinical mortality prediction."
    }
