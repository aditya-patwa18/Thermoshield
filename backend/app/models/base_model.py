from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseRiskModel(ABC):
    """
    Abstract Base Class for Health Risk Models.
    Allows seamless hot-swapping between the current Rule-Based Prototype Engine
    and future ML Models (e.g. Scikit-learn, XGBoost, or PyTorch trained on
    epidemiological hospital admission/excess mortality datasets).
    """

    @abstractmethod
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts heat-health risk score and metadata from environmental and demographic features.
        
        Args:
            features: Dictionary containing:
                - htsi_score (float, 0-100)
                - pvi_score (float, 0-100)
                - max_temperature (float, °C)
                - min_temperature (float, °C) - night-time recovery metric
                - consecutive_hot_days (int) - heatwave persistence
                - wbgt_max (float, °C)
                - humidity_avg (float, %)
                
        Returns:
            Dictionary containing:
                - risk_score (float, 0-100)
                - category (str: Low, Moderate, High, Very High, Extreme)
                - model_type (str)
                - disclaimer (str)
                - confidence_interval (dict)
                - operational_implications (list)
        """
        raise NotImplementedError
