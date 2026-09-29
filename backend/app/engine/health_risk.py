from typing import Dict, Any
from ..models.rule_based_model import RuleBasedRiskModel
from ..models.base_model import BaseRiskModel

# Singleton instance of risk model (ML-ready plug-in interface)
_current_risk_model: BaseRiskModel = RuleBasedRiskModel()

def get_risk_model() -> BaseRiskModel:
    return _current_risk_model

def set_risk_model(model: BaseRiskModel) -> None:
    global _current_risk_model
    _current_risk_model = model

def calculate_health_risk(
    htsi_score: float,
    pvi_score: float = 45.0,
    max_temperature: float = 35.0,
    min_temperature: float = 25.0,
    consecutive_hot_days: int = 1
) -> Dict[str, Any]:
    """
    Executes the health risk assessment through the active model (currently RuleBasedRiskModel).
    Returns a standardized dictionary containing risk score, category, and operational guidance.
    """
    features = {
        "htsi_score": htsi_score,
        "pvi_score": pvi_score,
        "max_temperature": max_temperature,
        "min_temperature": min_temperature,
        "consecutive_hot_days": consecutive_hot_days
    }
    model = get_risk_model()
    return model.predict(features)
