from typing import Dict, Any, List
from .base_model import BaseRiskModel

class RuleBasedRiskModel(BaseRiskModel):
    """
    Transparent, deterministic rule-based prototype risk engine.
    Combines Human Thermal Stress Index (HTSI), Population Vulnerability Index (PVI),
    nocturnal temperature retention (tropical nights), and heatwave persistence.
    """

    def __init__(self):
        self.model_version = "v1.0-rule-prototype"

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        htsi = float(features.get("htsi_score", 50.0))
        pvi = float(features.get("pvi_score", 45.0))  # defaults to moderate if outside India dataset
        max_temp = float(features.get("max_temperature", 35.0))
        min_temp = float(features.get("min_temperature", 25.0))
        consecutive_days = int(features.get("consecutive_hot_days", 1))

        # 1. Base thermal-vulnerability interaction
        # When thermal stress is high, vulnerability magnifies risk multiplicatively
        # Scale: 0 to 100
        interaction_factor = 1.0 + ((pvi / 100.0) * 0.35)
        base_risk = (htsi * 0.65 + pvi * 0.35) * (0.85 + 0.15 * (interaction_factor))

        # 2. Night-time heat retention penalty (Tropical nights effect)
        # In epidemiology, lack of nocturnal cooling (Tmin > 25°C) prevents cardiovascular recuperation
        nocturnal_penalty = 0.0
        if min_temp >= 29.0:
            nocturnal_penalty = 12.0
        elif min_temp >= 27.0:
            nocturnal_penalty = 8.0
        elif min_temp >= 25.0:
            nocturnal_penalty = 4.0

        # 3. Heatwave persistence multiplier
        # Consecutive days of intense heat multiply exhaustion and healthcare load
        persistence_penalty = 0.0
        if max_temp >= 38.0:
            persistence_penalty = min(15.0, (consecutive_days - 1) * 3.5)

        total_risk = base_risk + nocturnal_penalty + persistence_penalty
        risk_score = max(0.0, min(100.0, round(total_risk, 1)))

        # Categorization
        if risk_score <= 25.0:
            category = "Low"
            color = "#10B981"  # Emerald
            summary = "Low population heat-health risk. General civic safety measures apply."
        elif risk_score <= 50.0:
            category = "Moderate"
            color = "#F59E0B"  # Amber
            summary = "Moderate risk. High-risk groups (seniors, outdoor workers) require targeted monitoring."
        elif risk_score <= 70.0:
            category = "High"
            color = "#EA580C"  # Orange
            summary = "High health strain. Surge in dehydration, heat exhaustion, and ER inquiries anticipated."
        elif risk_score <= 85.0:
            category = "Very High"
            color = "#EF4444"  # Red
            summary = "Dangerous heat-health emergency. Elevated hospital admissions likely without rapid intervention."
        else:
            category = "Extreme"
            color = "#7F1D1D"  # Dark Crimson
            summary = "Critical public health emergency. Systemic risk of severe heat-related morbidity and mortality."

        # Operational implications
        implications: List[str] = []
        if risk_score >= 70.0:
            implications.append("Activate Heat Action Plan (HAP) Level 2 or 3")
            implications.append("Prepare emergency medical response and hospital cooling wards")
            implications.append("Mandate mandatory shade/rest breaks for outdoor construction and delivery workers")
        elif risk_score >= 50.0:
            implications.append("Issue yellow/orange public heat advisory")
            implications.append("Open municipal water distribution kiosks")
        else:
            implications.append("Standard warm-weather public awareness messaging")

        if nocturnal_penalty >= 8.0:
            implications.append(f"Nocturnal thermal stress elevated (min temp {min_temp:.1f}°C); open 24-hour night cooling shelters")

        return {
            "risk_score": risk_score,
            "category": category,
            "color": color,
            "summary": summary,
            "model_type": "Rule-Based Deterministic Prototype",
            "model_version": self.model_version,
            "disclaimer": "Simulation score generated from thermal-stress and vulnerability indicators. Not a validated mortality forecast.",
            "operational_implications": implications,
            "features_used": {
                "htsi_score": htsi,
                "pvi_score": pvi,
                "max_temperature": max_temp,
                "min_temperature": min_temp,
                "consecutive_hot_days": consecutive_days,
                "nocturnal_penalty": nocturnal_penalty,
                "persistence_penalty": persistence_penalty
            }
        }
