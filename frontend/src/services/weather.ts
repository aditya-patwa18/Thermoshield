import type { CurrentWeather, LocationInfo } from '../types';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface LiveHeatFieldReading {
  id: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
}

export interface LiveWeatherForecast {
  current: CurrentWeather;
  daily: Array<Record<string, number | string>>;
  hourly_24h: Array<Record<string, number | string>>;
  source: string;
  is_live: true;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const currentCache = new Map<string, CacheEntry<LiveHeatFieldReading[]>>();
const forecastCache = new Map<string, CacheEntry<LiveWeatherForecast>>();

const getCached = <T,>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

const setCached = <T,>(cache: Map<string, CacheEntry<T>>, key: string, value: T): T => {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
};

const fetchOpenMeteo = async (params: URLSearchParams): Promise<any> => {
  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  return response.json();
};

export const fetchCurrentReadings = async (locations: LocationInfo[]): Promise<LiveHeatFieldReading[]> => {
  if (!locations.length) return [];
  const cacheKey = locations
    .map(({ id, latitude, longitude }) => `${id}:${latitude.toFixed(3)},${longitude.toFixed(3)}`)
    .join('|');
  const cached = getCached(currentCache, cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: locations.map((location) => location.latitude).join(','),
    longitude: locations.map((location) => location.longitude).join(','),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,direct_normal_irradiance',
    timezone: 'auto'
  });
  const response = await fetchOpenMeteo(params);
  const points = Array.isArray(response) ? response : [response];
  if (points.length !== locations.length) {
    throw new Error(`Open-Meteo returned ${points.length} locations for ${locations.length} requested`);
  }

  const readings = points.map((point: any, index: number) => {
    const current = point.current;
    if (current?.temperature_2m == null || current?.relative_humidity_2m == null) {
      throw new Error(`Open-Meteo returned incomplete current weather for ${locations[index].id}`);
    }
    return {
      id: locations[index].id,
      temperature_c: Number(current.temperature_2m),
      relative_humidity: Number(current.relative_humidity_2m),
      wind_speed_ms: Number(current.wind_speed_10m ?? 0) / 3.6,
      solar_radiation_wm2: Number(current.direct_normal_irradiance ?? 0)
    };
  });

  return setCached(currentCache, cacheKey, readings);
};

export const fetchWeatherForecast = async (latitude: number, longitude: number): Promise<LiveWeatherForecast> => {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = getCached(forecastCache, cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    forecast_days: '5',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,direct_normal_irradiance',
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,direct_normal_irradiance,surface_pressure,dew_point_2m',
    daily: 'temperature_2m_max,temperature_2m_min,wind_speed_10m_max,daylight_duration',
    timezone: 'auto'
  });
  const response = await fetchOpenMeteo(params);
  const current = response.current;
  if (current?.temperature_2m == null || current?.relative_humidity_2m == null) {
    throw new Error('Open-Meteo returned incomplete current weather');
  }

  const temperature = Number(current.temperature_2m);
  const humidity = Number(current.relative_humidity_2m);
  const windKmh = Number(current.wind_speed_10m ?? 0);
  const forecast: LiveWeatherForecast = {
    current: {
      temperature_c: temperature,
      relative_humidity: humidity,
      wind_speed_kmh: windKmh,
      wind_speed_ms: windKmh / 3.6,
      wind_direction_deg: Number(current.wind_direction_10m ?? 0),
      solar_radiation_wm2: Number(current.direct_normal_irradiance ?? 0),
      cloud_cover_percent: Number(current.cloud_cover ?? 0),
      surface_pressure_hpa: Number(current.surface_pressure ?? 1013.2),
      dew_point_c: Number(current.dew_point_2m ?? temperature - ((100 - humidity) / 5)),
      timestamp: String(current.time ?? ''),
      provider: 'Open-Meteo'
    },
    daily: (response.daily?.time ?? []).map((date: string, index: number) => ({
      date,
      temp_max: Number(response.daily.temperature_2m_max?.[index] ?? temperature),
      temp_min: Number(response.daily.temperature_2m_min?.[index] ?? temperature),
      wind_speed_max_kmh: Number(response.daily.wind_speed_10m_max?.[index] ?? 0),
      wind_speed_max_ms: Number(response.daily.wind_speed_10m_max?.[index] ?? 0) / 3.6
    })),
    hourly_24h: (response.hourly?.time ?? []).slice(0, 24).map((time: string, index: number) => ({
      time,
      hour: time.includes('T') ? time.split('T')[1].slice(0, 5) : time,
      temperature_c: Number(response.hourly.temperature_2m?.[index] ?? temperature),
      relative_humidity: Number(response.hourly.relative_humidity_2m?.[index] ?? humidity),
      wind_speed_ms: Number(response.hourly.wind_speed_10m?.[index] ?? 0) / 3.6,
      solar_radiation_wm2: Number(response.hourly.direct_normal_irradiance?.[index] ?? 0)
    })),
    source: 'Live Open-Meteo',
    is_live: true
  };

  return setCached(forecastCache, cacheKey, forecast);
};