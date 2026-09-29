from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta

ALERT_TEMPLATES = {
    "public_warning": {
        "name": "Public Heat Warning",
        "audience": "General Public",
        "template": (
            "🚨 HEAT ADVISORY: {location} is experiencing {severity} heat stress ({temperature}°C, "
            "HTSI: {htsi}/100). Peak thermal intensity expected between {peak_time}. "
            "Stay indoors, drink electrolytes regularly, and avoid direct sun exposure. "
            "Check on elderly neighbors."
        )
    },
    "municipal_warning": {
        "name": "Municipal Operational Directive",
        "audience": "City Officials & Disaster Management",
        "template": (
            "⚠️ MUNICIPAL DIRECTIVE: {location} heat-health risk has reached {severity} ({risk_score}/100). "
            "Action required: Activate Heat Action Plan Level {hap_level}, open all designated cooling centers, "
            "and deploy mobile water tankers to high-density wards."
        )
    },
    "hospital_warning": {
        "name": "Hospital Preparedness Alert",
        "audience": "Hospitals & Emergency Medical Services",
        "template": (
            "🏥 HEALTHCARE ALERT: Surge in heat-related illnesses anticipated in {location}. "
            "Prepare emergency room cooling beds, verify IV fluids / ORS stocks, "
            "and place extra ambulance crews on standby. High risk among seniors and chronic illness patients."
        )
    },
    "outdoor_worker_warning": {
        "name": "Labor & Outdoor Worker Advisory",
        "audience": "Construction, Agriculture & Delivery Services",
        "template": (
            "👷 OCCUPATIONAL SAFETY: Outdoor WBGT in {location} has reached critical threshold ({wbgt}°C). "
            "Mandate work-rest cycles (e.g. 15-30 min rest/hour under shade). "
            "Halt unshaded strenuous labor between 12:00 PM and 4:00 PM. Hydration mandatory."
        )
    },
    "cooling_center_alert": {
        "name": "Cooling Facility Activation Order",
        "audience": "Community Centers & Facility Operators",
        "template": (
            "❄️ COOLING CENTER NOTICE: Immediate activation of designated heat relief shelters in {location}. "
            "Ensure air conditioning / evaporative coolers are operational, potable chilled water is stocked, "
            "and first-aid kits are accessible."
        )
    },
    "extreme_emergency": {
        "name": "Extreme Heat Public Emergency",
        "audience": "Mass Emergency Broadcast",
        "template": (
            "⛔ CRITICAL HEAT EMERGENCY: Lethal thermal conditions in {location} (HTSI: {htsi}/100, Temp: {temperature}°C). "
            "Extremely dangerous for human thermoregulation. Seek air-conditioned shelter immediately. "
            "For medical heat distress, dial emergency services immediately."
        )
    }
}

def generate_recommendations(
    risk_category: str,
    vulnerability_score: float = 50.0,
    infrastructure_deficit: float = 40.0,
    consecutive_days: int = 1
) -> List[Dict[str, Any]]:
    """
    Generates actionable, prioritized civic and public health recommendations
    dynamically based on risk level, vulnerability, and infrastructure status.
    """
    recs: List[Dict[str, Any]] = []

    cat = risk_category.upper()

    if cat == "LOW":
        recs.append({
            "priority": "Low",
            "category": "Public Awareness",
            "title": "Maintain Normal Hydration",
            "description": "Encourage routine fluid intake during peak afternoon hours."
        })
        recs.append({
            "priority": "Low",
            "category": "Civic Readiness",
            "title": "Monitor Seasonal Weather Outlook",
            "description": "Keep standard surveillance active across municipal weather observation stations."
        })
    elif cat == "MODERATE":
        recs.append({
            "priority": "Medium",
            "category": "Public Advisory",
            "title": "Issue Yellow Heat Advisory",
            "description": "Advise citizens to limit unshaded physical exertion between 1:00 PM and 4:00 PM."
        })
        recs.append({
            "priority": "Medium",
            "category": "Vulnerable Outreach",
            "title": "Monitor Seniors and Outdoor Workers",
            "description": "Advise employers to provide shaded rest stops and clean drinking water."
        })
        recs.append({
            "priority": "Medium",
            "category": "Infrastructure",
            "title": "Inspect Public Water Distribution Kiosks",
            "description": "Ensure public drinking points and municipal water posts are fully operational."
        })
    elif cat == "HIGH":
        recs.append({
            "priority": "High",
            "category": "Public Alert",
            "title": "Issue Orange Heat Warning",
            "description": "Broadcast alerts across local media and mobile channels warning of high heat stress."
        })
        recs.append({
            "priority": "High",
            "category": "Occupational Regulation",
            "title": "Regulate Outdoor Work Hours",
            "description": "Enforce mandatory shaded rest intervals (minimum 15 mins/hour) for construction and delivery labor."
        })
        recs.append({
            "priority": "High",
            "category": "Healthcare Preparedness",
            "title": "Alert Emergency Departments",
            "description": "Notify emergency rooms and PHCs to stock oral rehydration salts (ORS), IV fluids, and ice packs."
        })
        recs.append({
            "priority": "High",
            "category": "Cooling Shelter",
            "title": "Prepare Civic Cooling Centers",
            "description": "Put community centers, libraries, and public halls on standby for daytime cooling access."
        })
    elif cat == "VERY HIGH":
        recs.append({
            "priority": "Urgent",
            "category": "Emergency Directive",
            "title": "Activate Heat Action Plan (HAP) Level 2",
            "description": "Declare red heat emergency across civic administration and mobilize inter-agency task forces."
        })
        recs.append({
            "priority": "Urgent",
            "category": "Cooling Centers",
            "title": "Open All Public Cooling Centers (10 AM - 7 PM)",
            "description": "Provide free air-conditioned shelter, cold water, and emergency medical monitoring."
        })
        recs.append({
            "priority": "Urgent",
            "category": "Labor Suspension",
            "title": "Halt Non-Essential Strenuous Outdoor Labor",
            "description": "Suspend heavy outdoor construction and road work between 11:30 AM and 4:30 PM."
        })
        recs.append({
            "priority": "Urgent",
            "category": "Healthcare Surge",
            "title": "Deploy Heat Stroke Treatment Wards",
            "description": "Designate dedicated rapid-cooling immersion tubs and triage units in district hospitals."
        })
        recs.append({
            "priority": "Urgent",
            "category": "Water Deployment",
            "title": "Deploy Mobile Water Tankers to Slum Wards",
            "description": "Target high-density settlements and transit hubs with emergency hydration points."
        })
    else:  # EXTREME
        recs.append({
            "priority": "Critical Emergency",
            "category": "Disaster Response",
            "title": "Activate Highest Level Heat Disaster Protocol",
            "description": "Mobilize State/City Disaster Management Authority. All non-critical public operations redirected to heat relief."
        })
        recs.append({
            "priority": "Critical Emergency",
            "category": "24/7 Cooling Shelters",
            "title": "Operate 24-Hour Continuous Cooling Centers",
            "description": "Keep shelters open overnight to mitigate deadly nocturnal heat retention."
        })
        recs.append({
            "priority": "Critical Emergency",
            "category": "Mass Warning Broadcast",
            "title": "Broadcast Emergency Sirens & Wireless Alerts",
            "description": "Issue geo-targeted SMS and broadcast sirens urging citizens to seek shelter."
        })
        recs.append({
            "priority": "Critical Emergency",
            "category": "Complete Labor Moratorium",
            "title": "Mandate Strict Outdoor Labor Moratorium",
            "description": "Total prohibition of unshaded manual labor during daylight hours."
        })
        recs.append({
            "priority": "Critical Emergency",
            "category": "Mobile Health Squads",
            "title": "Deploy Rapid Paramedic Outreach Units",
            "description": "Dispatch mobile paramedic vans with chilled saline and active cooling into high-vulnerability wards."
        })

    # Additional contextual actions
    if vulnerability_score > 65.0:
        recs.append({
            "priority": "High",
            "category": "Targeted Outreach",
            "title": "High Vulnerability Settlement Patrols",
            "description": "Prioritize vulnerable elder care visits and door-to-door welfare checks in dense settlements."
        })

    if consecutive_days >= 3:
        recs.append({
            "priority": "Urgent",
            "category": "Extended Heatwave",
            "title": "Manage Cumulative Healthcare Strain",
            "description": "Rotate healthcare staff and replenish critical hospital fluid supplies due to prolonged heatwave duration."
        })

    return recs

def format_alert_message(
    template_key: str,
    location: str,
    severity: str,
    temperature: float,
    htsi: float,
    risk_score: float = 75.0,
    peak_time: str = "1:00 PM – 4:30 PM",
    wbgt: float = 32.0
) -> str:
    template_info = ALERT_TEMPLATES.get(template_key, ALERT_TEMPLATES["public_warning"])
    hap_level = 3 if severity.upper() == "EXTREME" else (2 if severity.upper() == "VERY HIGH" else 1)
    
    return template_info["template"].format(
        location=location,
        severity=severity.upper(),
        temperature=round(temperature, 1),
        htsi=round(htsi, 0),
        risk_score=round(risk_score, 0),
        peak_time=peak_time,
        wbgt=round(wbgt, 1),
        hap_level=hap_level
    )
