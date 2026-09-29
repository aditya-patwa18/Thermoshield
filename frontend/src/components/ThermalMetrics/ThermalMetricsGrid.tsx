import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  HelpCircle, 
  Compass,
  CloudRain
} from 'lucide-react';
import { CurrentWeather, ThermalIntelligence } from '../../types';

interface ThermalMetricsGridProps {
  weather: CurrentWeather;
  thermal: ThermalIntelligence;
  weatherSource?: string;
  isLiveWeather?: boolean;
}

export const ThermalMetricsGrid: React.FC<ThermalMetricsGridProps> = ({
  weather,
  thermal,
  weatherSource = 'Live Open-Meteo',
  isLiveWeather = true
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      
      {/* Meteorological Observations Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Thermal Environment & Physiological Indices
          </h3>
          <p className="text-xs text-slate-400">
            Deterministically derived from real-time meteorological observations
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300">
          <span className={`w-2 h-2 rounded-full ${isLiveWeather ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{weatherSource}</span>
        </div>
      </div>

      {/* Raw Meteorological Observations */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Air Temp */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Air Temp</span>
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.temperature_c}°</span>
            <span className="text-xs text-slate-400 ml-1">C</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Dry-bulb ambient</div>
        </div>

        {/* Relative Humidity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.relative_humidity}%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Dew Pt: {weather.dew_point_c}°C</div>
        </div>

        {/* Wind Speed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Wind Speed</span>
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.wind_speed_ms}</span>
            <span className="text-xs text-slate-400 ml-1">m/s</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{weather.wind_speed_kmh} km/h • {weather.wind_direction_deg}°</div>
        </div>

        {/* Solar Radiation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Solar Radiation</span>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.solar_radiation_wm2}</span>
            <span className="text-[10px] text-slate-400 ml-1">W/m²</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Direct solar flux</div>
        </div>

        {/* Cloud Cover */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cloud Cover</span>
            <CloudRain className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.cloud_cover_percent}%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Sky obstruction</div>
        </div>

        {/* Surface Pressure */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pressure</span>
            <Compass className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{weather.surface_pressure_hpa}</span>
            <span className="text-[10px] text-slate-400 ml-1">hPa</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Barometric pressure</div>
        </div>

      </div>

      {/* Human Thermal Stress Core Indices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        
        {/* Heat Index */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Heat Index (Apparent)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {thermal.heat_index.category}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{thermal.heat_index.value}°</span>
              <span className="text-sm font-semibold text-slate-400">C</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {thermal.heat_index.description}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
            NOAA Rothfusz regression
          </div>
        </div>

        {/* Wet Bulb Temperature with Tooltip */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Wet Bulb
                </span>
                <button
                  onMouseEnter={() => setActiveTooltip('wet_bulb')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {thermal.wet_bulb.category}
              </span>
            </div>

            {/* Tooltip Overlay */}
            {activeTooltip === 'wet_bulb' && (
              <div className="absolute top-10 left-3 right-3 bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-[11px] text-slate-200 z-30 leading-normal">
                {thermal.wet_bulb.tooltip}
              </div>
            )}

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{thermal.wet_bulb.value}°</span>
              <span className="text-sm font-semibold text-slate-400">C</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {thermal.wet_bulb.warning}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
            Stull (2011) psychrometric model
          </div>
        </div>

        {/* WBGT (Wet Bulb Globe Temp) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Outdoor WBGT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                {thermal.wbgt.category}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{thermal.wbgt.value}°</span>
              <span className="text-sm font-semibold text-slate-400">C</span>
            </div>
            <div className="mt-2 text-xs text-orange-300 font-medium">
              ⚠️ {thermal.wbgt.work_rest_ratio}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {thermal.wbgt.hydration_guide}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
            ISO 7243 / ACSM occupational standard
          </div>
        </div>

        {/* UTCI (Universal Thermal Climate Index) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                UTCI Index
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {thermal.utci.category}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{thermal.utci.value}°</span>
              <span className="text-sm font-semibold text-slate-400">C</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-200">
              {thermal.utci.stress_level}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {thermal.utci.physiological_strain}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
            Bröde multi-node thermoregulation
          </div>
        </div>

      </div>

    </div>
  );
};
