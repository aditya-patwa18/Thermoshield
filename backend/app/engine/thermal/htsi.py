from typing import List, Dict, Any
from .heat_index import calculate_heat_index
from .wet_bulb import calculate_wet_bulb
from .wbgt import calculate_wbgt
from .utci import calculate_utci

# Configurable Weights for HTSI components (sum to 1.0)
DEFAULT_WEIGHTS = {
    "temperature": 0.15,
    "humidity": 0.15,
    "radiation": 0.10,
    "wind_stagnation": 0.10,
    "wbgt": 0.25,
    "utci": 0.25
}

def calculate_htsi(
    temperature_c: float,
    relative_humidity: float,
    wind_speed_ms: float = 1.5,
    solar_radiation_wm2: float = 400.0,
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Calculates the Human Thermal Stress Index (HTSI), a comprehensive composite index
    scaled from 0 to 100 assessing the aggregate physiological heat strain on the human body.
    
    Categorization:
        0–20:   Low
        21–40:  Moderate
        41–60:  High
        61–80:  Very High
        81–100: Extreme
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    # Compute underlying sub-indices
    hi_res = calculate_heat_index(temperature_c, relative_humidity)
    wb_res = calculate_wet_bulb(temperature_c, relative_humidity)
    wbgt_res = calculate_wbgt(temperature_c, relative_humidity, wind_speed_ms, solar_radiation_wm2)
    utci_res = calculate_utci(temperature_c, relative_humidity, wind_speed_ms, solar_radiation_wm2)

    # 1. Normalize Temperature Component (0 at 22°C, 100 at 48°C)
    t_val = float(temperature_c)
    norm_temp = max(0.0, min(100.0, ((t_val - 22.0) / (48.0 - 22.0)) * 100.0))

    # 2. Normalize Humidity Component (penalizes high humidity when temp > 28°C)
    rh_val = float(relative_humidity)
    if t_val > 28.0:
        norm_rh = max(0.0, min(100.0, (rh_val / 100.0) * 100.0))
    else:
        norm_rh = max(0.0, min(100.0, (rh_val / 100.0) * 50.0))

    # 3. Normalize Solar Radiation (0 at 0 W/m², 100 at 1000 W/m²)
    rad_val = float(solar_radiation_wm2)
    norm_rad = max(0.0, min(100.0, (rad_val / 1000.0) * 100.0))

    # 4. Wind Stagnation penalty (low wind traps sweat vapor layer; very high wind with temp > 38°C adds heat)
    wind_val = float(wind_speed_ms)
    if t_val < 38.0:
        # Wind helps cooling; lack of wind (< 1.5 m/s) penalizes
        if wind_val < 1.0:
            norm_wind = 90.0
        elif wind_val < 2.0:
            norm_wind = 60.0
        elif wind_val < 3.5:
            norm_wind = 30.0
        else:
            norm_wind = 10.0
    else:
        # Super-heated air convection: high wind speeds increase thermal load
        norm_wind = min(100.0, 50.0 + wind_val * 8.0)

    # 5. Normalize WBGT Component (0 at 20°C, 100 at 36°C)
    wbgt_val = wbgt_res["value"]
    norm_wbgt = max(0.0, min(100.0, ((wbgt_val - 20.0) / (36.0 - 20.0)) * 100.0))

    # 6. Normalize UTCI Component (0 at 24°C, 100 at 50°C)
    utci_val = utci_res["value"]
    norm_utci = max(0.0, min(100.0, ((utci_val - 24.0) / (50.0 - 24.0)) * 100.0))

    # Weighted Sum
    raw_htsi = (
        norm_temp * weights["temperature"]
        + norm_rh * weights["humidity"]
        + norm_rad * weights["radiation"]
        + norm_wind * weights["wind_stagnation"]
        + norm_wbgt * weights["wbgt"]
        + norm_utci * weights["utci"]
    )
    htsi_score = max(0.0, min(100.0, round(raw_htsi, 1)))

    # Classification
    if htsi_score <= 20.0:
        category = "Low"
        summary = "Minimal human thermal stress. Normal outdoor activity permissible."
        color = "#10B981"  # Emerald
    elif htsi_score <= 40.0:
        category = "Moderate"
        summary = "Noticeable thermal discomfort. Increased hydration advised for outdoor labor."
        color = "#F59E0B"  # Amber
    elif htsi_score <= 60.0:
        category = "High"
        summary = "Elevated heat stress. Vulnerable groups and outdoor workers require active mitigation."
        color = "#EA580C"  # Orange
    elif htsi_score <= 80.0:
        category = "Very High"
        summary = "Dangerous thermal load. High risk of heat exhaustion, cramps, and systemic strain."
        color = "#EF4444"  # Red
    else:
        category = "Extreme"
        summary = "Critical emergency thermal environment. Risk of fatal heat stroke across population."
        color = "#7F1D1D"  # Dark Crimson

    # Dynamic Primary Drivers generator
    drivers: List[str] = []
    driver_scores: List[Dict[str, Any]] = []

    if rh_val >= 60.0 and t_val >= 30.0:
        drivers.append(f"High relative humidity ({rh_val:.0f}%) suppresses evaporative sweat cooling")
        driver_scores.append({"name": "Relative Humidity", "score": norm_rh, "impact": "High"})
    elif rh_val >= 45.0 and t_val >= 34.0:
        drivers.append(f"Elevated humidity ({rh_val:.0f}%) amplifies apparent temperature")
        driver_scores.append({"name": "Relative Humidity", "score": norm_rh, "impact": "Moderate"})

    if rad_val >= 600.0:
        drivers.append(f"Intense direct solar radiation ({rad_val:.0f} W/m²) amplifies radiant heat absorption")
        driver_scores.append({"name": "Solar Radiation", "score": norm_rad, "impact": "High"})
    elif rad_val >= 350.0:
        drivers.append(f"Moderate solar irradiance ({rad_val:.0f} W/m²) elevates mean radiant temperature")
        driver_scores.append({"name": "Solar Radiation", "score": norm_rad, "impact": "Moderate"})

    if wind_val < 1.2:
        drivers.append(f"Near-stagnant air ({wind_val:.1f} m/s) prevents convective body heat dissipation")
        driver_scores.append({"name": "Low Wind / Stagnation", "score": norm_wind, "impact": "High"})
    elif wind_val > 6.0 and t_val > 38.0:
        drivers.append(f"High wind velocity ({wind_val:.1f} m/s) accelerates hot convective heat transfer")
        driver_scores.append({"name": "Hot Convection", "score": norm_wind, "impact": "High"})

    if wbgt_val >= 30.0:
        drivers.append(f"Outdoor WBGT ({wbgt_val:.1f}°C) exceeds critical workplace safety thresholds")
        driver_scores.append({"name": "WBGT Thermal Load", "score": norm_wbgt, "impact": "High"})

    if utci_val >= 38.0:
        drivers.append(f"UTCI ({utci_val:.1f}°C) indicates {utci_res['stress_level'].lower()}")
        driver_scores.append({"name": "UTCI Biometeorological Strain", "score": norm_utci, "impact": "High"})

    if t_val >= 38.0:
        drivers.append(f"Extreme ambient dry-bulb temperature ({t_val:.1f}°C)")
        driver_scores.append({"name": "Ambient Temperature", "score": norm_temp, "impact": "High"})
    elif t_val >= 32.0:
        drivers.append(f"Elevated ambient temperature ({t_val:.1f}°C)")
        driver_scores.append({"name": "Ambient Temperature", "score": norm_temp, "impact": "Moderate"})

    if not drivers:
        drivers.append("Thermal parameters are within normal physiological tolerance ranges.")
        driver_scores.append({"name": "Baseline Metrics", "score": 20.0, "impact": "Low"})

    return {
        "score": htsi_score,
        "category": category,
        "summary": summary,
        "color": color,
        "primary_drivers": drivers,
        "driver_scores": driver_scores,
        "sub_indices": {
            "heat_index": hi_res,
            "wet_bulb": wb_res,
            "wbgt": wbgt_res,
            "utci": utci_res
        },
        "components": {
            "normalized_temperature": round(norm_temp, 1),
            "normalized_humidity": round(norm_rh, 1),
            "normalized_radiation": round(norm_rad, 1),
            "normalized_wind_stagnation": round(norm_wind, 1),
            "normalized_wbgt": round(norm_wbgt, 1),
            "normalized_utci": round(norm_utci, 1)
        }
    }
