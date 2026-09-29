export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface LocationInfo {
  id: string;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  is_indian_covered: boolean;
  ward?: any;
}

export interface CurrentWeather {
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  solar_radiation_wm2: number;
  cloud_cover_percent: number;
  surface_pressure_hpa: number;
  dew_point_c: number;
  condition?: string;
  timestamp: string;
  provider?: string;
}

export interface WeatherData {
  current: CurrentWeather;
  source: string;
  is_live: boolean;
}

export interface ThermalSubIndex {
  value: number;
  unit: string;
  category: string;
  description?: string;
  warning?: string;
  tooltip?: string;
  flag_color?: string;
  work_rest_ratio?: string;
  hydration_guide?: string;
  stress_level?: string;
  physiological_strain?: string;
}

export interface ThermalIntelligence {
  htsi: number;
  htsi_category: RiskCategory;
  htsi_summary: string;
  htsi_color: string;
  heat_index: ThermalSubIndex;
  wet_bulb: ThermalSubIndex;
  wbgt: ThermalSubIndex;
  utci: ThermalSubIndex;
  components: Record<string, number>;
}

export interface VulnerabilityIntelligence {
  score: number;
  category: string;
  summary: string;
  drivers: string[];
  components: Record<string, number>;
  has_coverage: boolean;
  coverage_notice?: string;
  source?: string;
  ward_id?: string;
  ward_name?: string;
}

export interface HealthRiskIntelligence {
  risk_score: number;
  category: RiskCategory;
  color: string;
  summary: string;
  model_type: string;
  model_version: string;
  disclaimer: string;
  operational_implications: string[];
  features_used: Record<string, any>;
}

export interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity_avg: number;
  wind_speed_ms: number;
  htsi_score: number;
  htsi_category: RiskCategory;
  wbgt: number;
  utci: number;
  heat_index: number;
  risk_score: number;
  risk_category: RiskCategory;
  color: string;
}

export interface HourlyForecast {
  hour: string;
  time?: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
  htsi_score: number;
  wbgt: number;
  utci: number;
}

export interface PeakPeriod {
  window: string;
  peak_temperature_c: number;
  peak_htsi: number;
}

export interface RiskDriver {
  name: string;
  score: number;
  impact: string;
}

export interface ActionRecommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
}

export interface ActiveAlert {
  alert_id: string;
  severity: string;
  location: string;
  valid_from: string;
  valid_until?: string;
  title: string;
  message: string;
  actions: string[];
}

export interface CoolingCenter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  opening_status: string;
  amenities: string[];
  distance_km?: number;
  distance_m?: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  emergency_capability: string;
  approx_capacity: number;
  phone: string;
  has_rapid_cooling_unit: boolean;
  distance_km?: number;
  distance_m?: number;
}

export interface WaterPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  distance_km?: number;
  distance_m?: number;
}

export interface FacilitiesGroup {
  cooling_centers: CoolingCenter[];
  hospitals: Hospital[];
  water_points: WaterPoint[];
}

export interface DashboardData {
  location: LocationInfo;
  weather: WeatherData;
  thermal: ThermalIntelligence;
  vulnerability: VulnerabilityIntelligence;
  health_risk: HealthRiskIntelligence;
  forecast_5d: ForecastDay[];
  hourly_24h: HourlyForecast[];
  peak_risk_period: PeakPeriod;
  risk_drivers: RiskDriver[];
  primary_explanations: string[];
  recommended_actions: ActionRecommendation[];
  alerts: ActiveAlert[];
  nearby_facilities: FacilitiesGroup;
  metadata: {
    weather_source: string;
    health_model: string;
    is_live_weather: boolean;
    updated_at: string;
  };
}

export interface SystemStatus {
  status: string;
  version: string;
  backend_status: string;
  weather_provider: {
    name: string;
    type: string;
    status: string;
  };
  maps_configured: boolean;
  notifications: {
    sms: { provider: string; configured: boolean; status: string };
    whatsapp: { provider: string; configured: boolean; status: string };
    email: { provider: string; configured: boolean; status: string };
  };
}
