import math

def calculate_wet_bulb(temperature_c: float, relative_humidity: float) -> dict:
    """
    Calculates Wet-Bulb Temperature using Stull's (2011) empirical formula:
    Journal of Applied Meteorology and Climatology, 50(11), 2267-2269.
    
    Valid for RH between 5% and 99% and temperatures between -20°C and 50°C.
    
    Args:
        temperature_c: Ambient temperature in °C
        relative_humidity: Relative humidity in % (0 - 100)
        
    Returns:
        dict with value (float in °C), unit, category, and physiological tooltip
    """
    T = float(temperature_c)
    RH = max(1.0, min(100.0, float(relative_humidity)))
    
    tw = (
        T * math.atan(0.151977 * math.pow(RH + 8.313659, 0.5))
        + math.atan(T + RH)
        - math.atan(RH - 1.676331)
        + 0.00391838 * math.pow(RH, 1.5) * math.atan(0.023101 * RH)
        - 4.686035
    )
    tw_val = round(tw, 1)
    
    if tw_val < 24.0:
        category = "Safe"
        risk_level = "Low"
        warning = "Normal evaporative cooling capacity. Safe for outdoor tasks."
    elif tw_val < 28.0:
        category = "Caution"
        risk_level = "Moderate"
        warning = "Sweating efficiency reduces. Provide hydration breaks during strenuous physical work."
    elif tw_val < 30.0:
        category = "Extreme Caution"
        risk_level = "High"
        warning = "Significant strain on cardiovascular and thermoregulatory systems. Rest breaks required."
    elif tw_val < 32.0:
        category = "Critical Danger"
        risk_level = "Very High"
        warning = "Severe risk of heat stroke. Evaporative cooling through sweating is heavily impaired."
    else:
        category = "Lethal Threshold"
        risk_level = "Extreme"
        warning = "Approaching or exceeding human survivability limits (35°C). Fatal heat stress possible even for healthy individuals in shade."

    tooltip = (
        "Wet-bulb temperature is the lowest temperature achievable by water evaporation. "
        "It measures the human body's ability to cool itself through sweating. "
        "Above 30°C, continuous heavy labor risks life-threatening heat illness; "
        "above 35°C is considered an existential physiological limit."
    )

    return {
        "value": tw_val,
        "unit": "°C",
        "category": category,
        "risk_level": risk_level,
        "warning": warning,
        "tooltip": tooltip
    }
