from fastapi import APIRouter
from ..engine.scenario import simulate_thermal_scenario, simulate_administrative_actions
from ..schemas import ScenarioSimulationRequest, HeatActionSimulationRequest

router = APIRouter(tags=["Scenario Simulation Engine"])

@router.post("/scenario/simulate", summary="Run 'What-If?' Microclimate Scenario Simulation")
async def run_scenario_simulation(req: ScenarioSimulationRequest):
    """
    Simulates changes to ambient temperature, humidity, wind, and radiation,
    and recalculates WBGT, UTCI, HTSI, and Prototype Health Risk deltas.
    """
    return simulate_thermal_scenario(
        base_temperature_c=req.base_temperature_c,
        base_humidity=req.base_humidity,
        base_wind_speed_ms=req.base_wind_speed_ms,
        base_solar_radiation_wm2=req.base_solar_radiation_wm2,
        temp_delta_c=req.temp_delta_c,
        humidity_delta_pct=req.humidity_delta_pct,
        wind_delta_ms=req.wind_delta_ms,
        solar_radiation_override_wm2=req.solar_radiation_override_wm2,
        pvi_score=req.pvi_score
    )

@router.post("/scenario/interventions", summary="Simulate Administrative Heat Action Interventions")
async def run_intervention_simulation(req: HeatActionSimulationRequest):
    """
    Simulates civic mitigation levers (cooling centers, work shift, mass alerts, water distribution)
    and estimates population exposure and operational risk mitigation.
    """
    return simulate_administrative_actions(
        base_pvi_score=req.base_pvi_score,
        current_risk_score=req.current_risk_score,
        cooling_centers_active=req.cooling_centers_active,
        capacity_expansion_percent=req.capacity_expansion_percent,
        outdoor_work_shifted=req.outdoor_work_shifted,
        public_alert_issued=req.public_alert_issued,
        water_points_deployed=req.water_points_deployed
    )
