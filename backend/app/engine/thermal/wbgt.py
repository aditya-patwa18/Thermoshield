import math
from .wet_bulb import calculate_wet_bulb

def calculate_wbgt(
    temperature_c: float,
    relative_humidity: float,
    wind_speed_ms: float = 1.5,
    solar_radiation_wm2: float = 400.0
) -> dict:
    """
    Calculates the Wet-Bulb Globe Temperature (WBGT) for outdoor environments.
    
    Outdoor WBGT formula:
        WBGT = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
        
    Where:
        Tw = Natural wet-bulb temperature (°C)
        Tg = Black globe temperature (°C)
        Ta = Dry-bulb air temperature (°C)
        
    When Tg is unavailable from physical instruments, it is approximated using:
    Tg = Ta + 0.0149 * Solar_Radiation - 0.05 * max(0.1, wind_speed)
    (Based on Liljegren et al. / Australian Bureau of Meteorology biometeorological model).
    
    Returns:
        dict with value (float in °C), category, work_rest_ratio, hydration_guide, methodology
    """
    ta = float(temperature_c)
    rh = max(1.0, min(100.0, float(relative_humidity)))
    v = max(0.1, float(wind_speed_ms))
    s = max(0.0, float(solar_radiation_wm2))
    
    # 1. Calculate Tw
    tw_res = calculate_wet_bulb(ta, rh)
    tw = tw_res["value"]
    
    # 2. Approximate Globe Temperature Tg
    # Higher solar radiation increases globe temperature; higher wind cools the globe
    wind_cooling_factor = math.pow(v, 0.58)
    radiation_excess = (s / (1.0 + 0.3 * wind_cooling_factor)) * 0.018
    tg = ta + radiation_excess
    
    # 3. Calculate outdoor WBGT
    wbgt = 0.7 * tw + 0.2 * tg + 0.1 * ta
    wbgt_val = round(wbgt, 1)
    
    # ISO 7243 / OSHA / ACSM Work-Rest Guidelines
    if wbgt_val < 26.7:
        category = "Low"
        flag_color = "Green"
        work_rest_ratio = "Continuous work permitted"
        hydration_guide = "Drink 0.5L water per hour during moderate activity"
    elif wbgt_val < 29.4:
        category = "Moderate"
        flag_color = "Yellow"
        work_rest_ratio = "45 min work / 15 min rest per hour"
        hydration_guide = "Drink 0.75L water per hour; seek shade during rest"
    elif wbgt_val < 31.0:
        category = "High"
        flag_color = "Orange"
        work_rest_ratio = "30 min work / 30 min rest per hour"
        hydration_guide = "Drink 1.0L water per hour with electrolytes; rotate strenuous tasks"
    elif wbgt_val < 32.2:
        category = "Very High"
        flag_color = "Red"
        work_rest_ratio = "20 min work / 40 min rest per hour"
        hydration_guide = "Drink 1.0L+ water with oral rehydration salts; suspend heavy manual labor"
    else:
        category = "Extreme"
        flag_color = "Black"
        work_rest_ratio = "Cease all non-essential outdoor physical activity"
        hydration_guide = "Urgent medical monitoring required; active cooling mandatory"
        
    return {
        "value": wbgt_val,
        "unit": "°C",
        "category": category,
        "flag_color": flag_color,
        "work_rest_ratio": work_rest_ratio,
        "hydration_guide": hydration_guide,
        "globe_temperature_c": round(tg, 1),
        "natural_wet_bulb_c": round(tw, 1),
        "methodology": "ISO 7243 outdoor WBGT with Liljegren radiation-wind globe approximation"
    }
