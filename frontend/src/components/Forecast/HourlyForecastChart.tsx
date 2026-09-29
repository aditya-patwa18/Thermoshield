import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Clock, TrendingUp, Sun, Flame, Thermometer } from 'lucide-react';
import { HourlyForecast, PeakPeriod } from '../../types';

interface HourlyForecastChartProps {
  hourlyData: HourlyForecast[];
  peakPeriod?: PeakPeriod;
}

export const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({
  hourlyData,
  peakPeriod
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'htsi' | 'temp' | 'wbgt' | 'utci'>('htsi');

  const metricConfig = {
    htsi: {
      name: 'Human Thermal Stress (HTSI)',
      key: 'htsi_score',
      unit: '/100',
      color: '#EA580C',
      domain: [0, 100],
    },
    temp: {
      name: 'Air Temperature',
      key: 'temperature_c',
      unit: '°C',
      color: '#EF4444',
      domain: ['auto', 'auto'],
    },
    wbgt: {
      name: 'Outdoor WBGT',
      key: 'wbgt',
      unit: '°C',
      color: '#F59E0B',
      domain: ['auto', 'auto'],
    },
    utci: {
      name: 'UTCI Biometeorology',
      key: 'utci',
      unit: '°C',
      color: '#A855F7',
      domain: ['auto', 'auto'],
    },
  };

  const currentCfg = metricConfig[selectedMetric];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-slate-800">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            Time: {data.hour || label}
          </div>
          <div className="text-slate-300">
            Air Temp: <span className="font-bold text-white">{data.temperature_c}°C</span>
          </div>
          <div className="text-slate-300">
            HTSI: <span className="font-bold text-orange-400">{data.htsi_score} / 100</span>
          </div>
          <div className="text-slate-300">
            WBGT: <span className="font-bold text-amber-400">{data.wbgt}°C</span>
          </div>
          <div className="text-slate-300">
            Solar Flux: <span className="font-bold text-slate-200">{data.solar_radiation_wm2} W/m²</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      
      {/* Chart Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            24-Hour Diurnal Heat Progression
          </h3>
          {peakPeriod && (
            <p className="text-xs text-orange-400 font-medium mt-0.5">
              ⚠️ Peak Thermal Exposure Window: {peakPeriod.window} ({peakPeriod.peak_temperature_c}°C)
            </p>
          )}
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSelectedMetric('htsi')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedMetric === 'htsi'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HTSI
          </button>
          <button
            onClick={() => setSelectedMetric('temp')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedMetric === 'temp'
                ? 'bg-red-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temp
          </button>
          <button
            onClick={() => setSelectedMetric('wbgt')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedMetric === 'wbgt'
                ? 'bg-amber-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WBGT
          </button>
          <button
            onClick={() => setSelectedMetric('utci')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedMetric === 'utci'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UTCI
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentCfg.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentCfg.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="hour" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={currentCfg.domain as any}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={currentCfg.key}
              stroke={currentCfg.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
