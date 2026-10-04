import axios from 'axios';
import { DashboardData, SystemStatus, ActiveAlert, FacilitiesGroup } from '../types';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = configuredApiBaseUrl
  ? (/^https?:\/\//i.test(configuredApiBaseUrl) ? configuredApiBaseUrl : `https://${configuredApiBaseUrl}`)
  : import.meta.env.DEV ? 'http://localhost:8000' : '';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 12000,
});

export const api = {
  // System Status
  getHealth: async (): Promise<SystemStatus> => {
    const res = await client.get<SystemStatus>('/health');
    return res.data;
  },

  getConfig: async () => {
    const res = await client.get('/config');
    return res.data;
  },

  // Locations & Geospatial
  getLocations: async () => {
    const res = await client.get('/locations');
    return res.data;
  },

  getLocationById: async (id: string) => {
    const res = await client.get(`/locations/${id}`);
    return res.data;
  },

  getMumbaiWardsGeoJSON: async () => {
    const res = await client.get('/locations/wards/mumbai');
    return res.data;
  },

  reverseGeocode: async (lat: number, lon: number) => {
    const res = await client.get(`/geocode?lat=${lat}&lon=${lon}`);
    return res.data;
  },

  // Dashboard Unified Data
  getDashboardByLocation: async (locationId: string): Promise<DashboardData> => {
    const res = await client.get<DashboardData>(`/dashboard/location/${locationId}`);
    return res.data;
  },

  getDashboardByCoords: async (lat: number, lon: number, name?: string): Promise<DashboardData> => {
    const url = name
      ? `/dashboard?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`
      : `/dashboard?lat=${lat}&lon=${lon}`;
    const res = await client.get<DashboardData>(url);
    return res.data;
  },

  // Weather
  getWeather: async (lat?: number, lon?: number, city?: string) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lon) params.append('lon', lon.toString());
    if (city) params.append('city', city);
    const res = await client.get(`/weather?${params.toString()}`);
    return res.data;
  },

  // Thermal Calculations
  getThermal: async (temp: number, humidity: number, wind: number, solar: number) => {
    const res = await client.get(`/thermal?temperature=${temp}&humidity=${humidity}&wind_speed=${wind}&solar_radiation=${solar}`);
    return res.data;
  },

  // Infrastructure
  getInfrastructure: async (cityId?: string): Promise<FacilitiesGroup> => {
    const url = cityId ? `/infrastructure?city_id=${cityId}` : '/infrastructure';
    const res = await client.get(url);
    return res.data;
  },

  getNearestFacilities: async (lat: number, lon: number) => {
    const res = await client.get(`/infrastructure/nearest?lat=${lat}&lon=${lon}`);
    return res.data;
  },

  // Alerts & Notifications
  getActiveAlerts: async (): Promise<ActiveAlert[]> => {
    const res = await client.get<ActiveAlert[]>('/alerts');
    return res.data;
  },

  getAlertTemplates: async () => {
    const res = await client.get('/alerts/templates');
    return res.data;
  },

  previewAlert: async (payload: {
    template_key: string;
    location: string;
    severity: string;
    temperature: number;
    htsi: number;
    risk_score: number;
    peak_time: string;
    wbgt: number;
  }) => {
    const res = await client.post('/alerts/preview', payload);
    return res.data;
  },

  sendNotification: async (
    channel: 'sms' | 'whatsapp' | 'email',
    recipient: string,
    message: string,
    subject?: string
  ) => {
    const res = await client.post('/alerts/send', {
      channel,
      recipient,
      message,
      subject
    });
    return res.data;
  },

  // Simulation Sandbox
  simulateScenario: async (payload: {
    base_temperature_c: number;
    base_humidity: number;
    base_wind_speed_ms: number;
    base_solar_radiation_wm2: number;
    temp_delta_c: number;
    humidity_delta_pct: number;
    wind_delta_ms: number;
    solar_radiation_override_wm2?: number | null;
    pvi_score: number;
  }) => {
    const res = await client.post('/scenario/simulate', payload);
    return res.data;
  },

  simulateInterventions: async (payload: {
    base_pvi_score: number;
    current_risk_score: number;
    cooling_centers_active: boolean;
    capacity_expansion_percent: number;
    outdoor_work_shifted: boolean;
    public_alert_issued: boolean;
    water_points_deployed: number;
  }) => {
    const res = await client.post('/scenario/interventions', payload);
    return res.data;
  },
};
