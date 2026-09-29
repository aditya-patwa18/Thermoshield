from fastapi import APIRouter, Query
from ..engine.thermal import (
    calculate_heat_index,
    calculate_wet_bulb,
    calculate_wbgt,
    calculate_utci,
    calculate_htsi
)

router = APIRouter(tags=["Thermal Stress Engine"])

@router.get("/thermal", summary="Calculate Comprehensive Thermal Metrics Suite")
async def get_all_thermal(
    temperature: float = Query(35.0, description="Ambient temperature (°C)"),
    humidity: float = Query(60.0, ge=0, le=100, description="Relative humidity (%)"),
    wind_speed: float = Query(1.5, ge=0, description="Wind speed (m/s)"),
    solar_radiation: float = Query(450.0, ge=0, description="Direct solar radiation (W/m²)")
):
    """
    Computes all standard physiological thermal indices (Heat Index, Wet Bulb, WBGT, UTCI, and HTSI).
    """
    hi = calculate_heat_index(temperature, humidity)
    wb = calculate_wet_bulb(temperature, humidity)
    wbgt = calculate_wbgt(temperature, humidity, wind_speed, solar_radiation)
    utci = calculate_utci(temperature, humidity, wind_speed, solar_radiation)
    htsi = calculate_htsi(temperature, humidity, wind_speed, solar_radiation)

    return {
        "inputs": {
            "temperature_c": temperature,
            "relative_humidity": humidity,
            "wind_speed_ms": wind_speed,
            "solar_radiation_wm2": solar_radiation
        },
        "heat_index": hi,
        "wet_bulb": wb,
        "wbgt": wbgt,
        "utci": utci,
        "htsi": htsi
    }

@router.get("/wbgt", summary="Calculate Outdoor Wet-Bulb Globe Temperature (WBGT)")
async def get_wbgt(
    temperature: float = Query(35.0, description="Ambient temperature (°C)"),
    humidity: float = Query(60.0, ge=0, le=100, description="Relative humidity (%)"),
    wind_speed: float = Query(1.5, ge=0, description="Wind speed (m/s)"),
    solar_radiation: float = Query(450.0, ge=0, description="Solar radiation (W/m²)")
):
    return calculate_wbgt(temperature, humidity, wind_speed, solar_radiation)

@router.get("/utci", summary="Calculate Universal Thermal Climate Index (UTCI)")
async def get_utci(
    temperature: float = Query(35.0, description="Ambient temperature (°C)"),
    humidity: float = Query(60.0, ge=0, le=100, description="Relative humidity (%)"),
    wind_speed: float = Query(1.5, ge=0, description="Wind speed (m/s)"),
    solar_radiation: float = Query(450.0, ge=0, description="Solar radiation (W/m²)")
):
    return calculate_utci(temperature, humidity, wind_speed, solar_radiation)

@router.get("/htsi", summary="Calculate Human Thermal Stress Index (HTSI)")
async def get_htsi(
    temperature: float = Query(35.0, description="Ambient temperature (°C)"),
    humidity: float = Query(60.0, ge=0, le=100, description="Relative humidity (%)"),
    wind_speed: float = Query(1.5, ge=0, description="Wind speed (m/s)"),
    solar_radiation: float = Query(450.0, ge=0, description="Solar radiation (W/m²)")
):
    return calculate_htsi(temperature, humidity, wind_speed, solar_radiation)
