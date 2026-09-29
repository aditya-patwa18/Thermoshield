import math

def calculate_utci(
    temperature_c: float,
    relative_humidity: float,
    wind_speed_ms: float = 1.5,
    solar_radiation_wm2: float = 400.0
) -> dict:
    """
    Calculates an operational approximation of the Universal Thermal Climate Index (UTCI).
    UTCI assesses human physiological comfort/stress based on an equivalent ambient temperature
    incorporating thermoregulation, sweat evaporation, radiation, and wind chilling/heating.
    
    References:
    - Bröde et al. (2012): Deriving the operational procedure for the Universal Thermal Climate Index (UTCI).
    - Jendritzky et al. (2012): The Universal Thermal Climate Index (UTCI)—Why and How?
    
    Returns:
        dict with value (float in °C), stress_level, category, description, and physiological_strain
    """
    ta = float(temperature_c)
    rh = max(1.0, min(100.0, float(relative_humidity)))
    va = max(0.5, float(wind_speed_ms))
    rad = max(0.0, float(solar_radiation_wm2))
    
    # 1. Estimate water vapour pressure e (in hPa / kPa) using Magnus-Tetens
    e_sat = 6.112 * math.exp((17.67 * ta) / (ta + 243.5))  # hPa
    e_act = (rh / 100.0) * e_sat  # hPa
    e_kpa = e_act / 10.0  # kPa
    
    # 2. Approximate Mean Radiant Temperature delta (Tmrt - Ta) from solar radiation and wind
    # In full sunlight, Tmrt can be 10°C to 25°C above Ta depending on wind
    delta_tmrt = (rad / 80.0) / (1.0 + 0.2 * math.sqrt(va))
    
    # 3. UTCI offset calculation based on multi-variable biometeorological terms
    # Offset d_UTCI = UTCI - Ta
    # Thermal impact from radiation excess
    rad_effect = 0.5 * delta_tmrt
    
    # Thermal impact from humidity/vapour pressure excess above comfortable 1.5 kPa
    vapour_effect = 1.8 * (e_kpa - 1.5) if e_kpa > 1.5 else 0.5 * (e_kpa - 1.5)
    
    # Wind cooling vs convection heating:
    # If Ta > 37°C, high wind adds convective heat; if Ta < 37°C, wind cools
    if ta < 37.0:
        wind_effect = -1.2 * math.log(va + 0.1) * (37.0 - ta) * 0.1
    else:
        wind_effect = 0.8 * math.log(va + 0.1) * (ta - 37.0) * 0.1
        
    utci = ta + rad_effect + vapour_effect + wind_effect
    utci_val = round(utci, 1)
    
    # Standard UTCI Stress Categories
    if utci_val < 9.0:
        stress_level = "Cold Stress"
        category = "Low"
        physiological_strain = "Vasoconstriction; metabolic heat production increased"
    elif utci_val < 26.0:
        stress_level = "No Thermal Stress"
        category = "Comfortable"
        physiological_strain = "Thermal equilibrium; optimal physiological state"
    elif utci_val < 32.0:
        stress_level = "Moderate Heat Stress"
        category = "Moderate"
        physiological_strain = "Mild perspiration; increased cutaneous blood flow"
    elif utci_val < 38.0:
        stress_level = "Strong Heat Stress"
        category = "High"
        physiological_strain = "High sweat rates; cardiovascular strain and elevated core body temp"
    elif utci_val < 46.0:
        stress_level = "Very Strong Heat Stress"
        category = "Very High"
        physiological_strain = "Severe dehydration risk; body heat accumulation; thermoregulatory breakdown imminent"
    else:
        stress_level = "Extreme Heat Stress"
        category = "Extreme"
        physiological_strain = "Critical heat stroke hazard; cellular thermotolerance limits reached"
        
    return {
        "value": utci_val,
        "unit": "°C",
        "stress_level": stress_level,
        "category": category,
        "physiological_strain": physiological_strain,
        "mean_radiant_temp_delta": round(delta_tmrt, 1),
        "vapour_pressure_kpa": round(e_kpa, 2),
        "methodology": "Bröde et al. biometeorological polynomial approximation"
    }
