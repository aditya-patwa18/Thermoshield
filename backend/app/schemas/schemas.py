from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Health / Status ---
class HealthResponse(BaseModel):
    status: str = Field(default="online")
    version: str = Field(default="1.0.0")
    backend_status: str = Field(default="operational")
    weather_provider: Dict[str, Any]
    maps_configured: bool
    notifications: Dict[str, Any]

# --- Thermal Schemas ---
class ThermalMetricValue(BaseModel):
    value: float
    unit: str = "°C"
    category: str
    description: Optional[str] = None

class HTSIResponse(BaseModel):
    score: float
    category: str
    summary: str
    color: str
    primary_drivers: List[str]
    driver_scores: List[Dict[str, Any]]
    sub_indices: Dict[str, Any]
    components: Dict[str, float]

# --- Vulnerability Schemas ---
class VulnerabilityResponse(BaseModel):
    score: float
    category: str
    summary: str
    drivers: List[str]
    components: Dict[str, float]
    has_coverage: bool = True
    coverage_notice: Optional[str] = None

# --- Risk Schemas ---
class RiskResponse(BaseModel):
    risk_score: float
    category: str
    color: str
    summary: str
    model_type: str
    model_version: str
    disclaimer: str
    operational_implications: List[str]
    features_used: Dict[str, Any]

# --- Scenario Simulator Schemas ---
class ScenarioSimulationRequest(BaseModel):
    base_temperature_c: float = 36.0
    base_humidity: float = 65.0
    base_wind_speed_ms: float = 1.8
    base_solar_radiation_wm2: float = 600.0
    temp_delta_c: float = 2.0
    humidity_delta_pct: float = 10.0
    wind_delta_ms: float = -0.5
    solar_radiation_override_wm2: Optional[float] = None
    pvi_score: float = 55.0

class HeatActionSimulationRequest(BaseModel):
    base_pvi_score: float = 65.0
    current_risk_score: float = 78.0
    cooling_centers_active: bool = True
    capacity_expansion_percent: float = 25.0
    outdoor_work_shifted: bool = True
    public_alert_issued: bool = True
    water_points_deployed: int = 10

# --- Notification Schemas ---
class SendSMSRequest(BaseModel):
    recipient: str = "+919876543210"
    message: str = "Heat Warning: Stay hydrated."
    location: Optional[str] = None
    severity: Optional[str] = "HIGH"

class SendWhatsAppRequest(BaseModel):
    recipient: str = "+919876543210"
    message: str = "Heat Alert for Mumbai. Seek shade."
    location: Optional[str] = None
    severity: Optional[str] = "HIGH"

class SendEmailRequest(BaseModel):
    recipient: str = "officer@disaster-mgmt.gov.in"
    subject: str = "ThermalShield Operational Heat Warning"
    message: str = "Official Heat-Health Advisory..."
    location: Optional[str] = None
    severity: Optional[str] = "HIGH"

# --- Notification Preview ---
class NotificationPreviewRequest(BaseModel):
    template_key: str = "public_warning"
    location: str = "Mumbai"
    severity: str = "VERY HIGH"
    temperature: float = 38.5
    htsi: float = 79.0
    risk_score: float = 82.0
    peak_time: str = "1:30 PM - 5:00 PM"
    wbgt: float = 32.4
