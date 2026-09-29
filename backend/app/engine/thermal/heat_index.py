import math

def calculate_heat_index(temperature_c: float, relative_humidity: float) -> dict:
    """
    Calculates the Heat Index (apparent temperature) in degrees Celsius
    using the NOAA / National Weather Service Rothfusz regression equation.
    
    Args:
        temperature_c: Ambient temperature in degrees Celsius
        relative_humidity: Relative humidity as a percentage (0 - 100)
    
    Returns:
        dict with value (float in °C), unit (°C), and category (str)
    """
    t_f = (temperature_c * 9.0 / 5.0) + 32.0
    rh = max(0.0, min(100.0, float(relative_humidity)))
    
    # If below 80°F (approx 26.7°C), Rothfusz equation does not apply; use simple formula
    if t_f < 80.0:
        hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
    else:
        # Full Rothfusz regression
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * t_f * t_f
            - 0.05481717 * rh * rh
            + 0.00122874 * t_f * t_f * rh
            + 0.00085282 * t_f * rh * rh
            - 0.00000199 * t_f * t_f * rh * rh
        )
        
        # Adjustments
        if rh < 13.0 and 80.0 <= t_f <= 112.0:
            adjustment = ((13.0 - rh) / 4.0) * math.sqrt((17.0 - abs(t_f - 95.0)) / 17.0)
            hi_f -= adjustment
        elif rh > 85.0 and 80.0 <= t_f <= 87.0:
            adjustment = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
            hi_f += adjustment
            
    hi_c = round((hi_f - 32.0) * 5.0 / 9.0, 1)
    
    # Risk categorization
    if hi_c < 27.0:
        category = "Low"
        description = "Comfortable or minor thermal impact"
    elif hi_c < 33.0:
        category = "Caution"
        description = "Fatigue possible with prolonged exposure and physical activity"
    elif hi_c < 41.0:
        category = "Extreme Caution"
        description = "Heat cramps and heat exhaustion possible with prolonged exposure"
    elif hi_c < 54.0:
        category = "Danger"
        description = "Heat cramps or heat exhaustion likely; heat stroke possible with continued activity"
    else:
        category = "Extreme Danger"
        description = "Heat stroke highly likely with continued exposure"
        
    return {
        "value": hi_c,
        "unit": "°C",
        "category": category,
        "description": description
    }
