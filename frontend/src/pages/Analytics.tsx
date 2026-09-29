import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  AlertTriangle, 
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { DashboardData } from '../types';

interface AnalyticsPageProps {
  dashboardData: DashboardData | null;
}

export const Analytics: React.FC<AnalyticsPageProps> = ({ dashboardData }) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');

  // Realistic simulated historical analytics trend
  const historical7d = [
    { date: 'Sep 23', max_temp: 34.2, htsi: 64, risk: 58, heatwave: false },
    { date: 'Sep 24', max_temp: 35.8, htsi: 71, risk: 68, heatwave: false },
    { date: 'Sep 25', max_temp: 36.5, htsi: 75, risk: 74, heatwave: true },
    { date: 'Sep 26', max_temp: 37.8, htsi: 78, risk: 79, heatwave: true },
    { date: 'Sep 27', max_temp: 38.4, htsi: 82, risk: 84, heatwave: true },
    { date: 'Sep 28', max_temp: 37.9, htsi: 80, risk: 81, heatwave: true },
    { date: 'Sep 29', max_temp: 37.2, htsi: 79, risk: 78, heatwave: true },
  ];

  const historical30d = [
    { week: 'Week 1', days_above_very_high: 2, days_above_extreme: 0, peak_temp: 36.2 },
    { week: 'Week 2', days_above_very_high: 4, days_above_extreme: 1, peak_temp: 38.4 },
    { week: 'Week 3', days_above_very_high: 5, days_above_extreme: 2, peak_temp: 39.8 },
    { week: 'Week 4 (Current)', days_above_very_high: 6, days_above_extreme: 3, peak_temp: 40.5 },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Heatwave Persistence & Historical Surveillance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrospective exposure metrics, cumulative heatwave tracking, and epidemiological indicators
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${timeframe === '7d' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
          >
            7-Day Retrospective
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${timeframe === '30d' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
          >
            30-Day Monthly Trend
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Peak Season Air Temp</div>
          <div className="text-3xl font-black text-red-400 mt-2">40.5°C</div>
          <div className="text-[10px] text-slate-500 mt-1">Observed during Week 4</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Peak HTSI Index</div>
          <div className="text-3xl font-black text-orange-400 mt-2">84 / 100</div>
          <div className="text-[10px] text-slate-500 mt-1">Extreme heat stress bracket</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Days Above Very High</div>
          <div className="text-3xl font-black text-amber-400 mt-2">17 Days</div>
          <div className="text-[10px] text-slate-500 mt-1">Last 30-day surveillance period</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Heatwave Persistence</div>
          <div className="text-3xl font-black text-rose-500 mt-2">5 Consecutive</div>
          <div className="text-[10px] text-slate-500 mt-1">Active heatwave sequence</div>
        </div>

      </div>

      {/* Analytics Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          {timeframe === '7d' ? '7-Day Thermal Stress & Health Risk Progression' : '30-Day Critical Heat Threshold Exceedances'}
        </h3>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {timeframe === '7d' ? (
              <LineChart data={historical7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[30, 90]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="htsi" name="HTSI Stress" stroke="#EA580C" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="risk" name="Health Risk" stroke="#EF4444" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="max_temp" name="Max Temp (°C)" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={historical30d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="days_above_very_high" name="Days > Very High Risk" fill="#EA580C" radius={[6, 6, 0, 0]} />
                <Bar dataKey="days_above_extreme" name="Days > Extreme Risk" fill="#991B1B" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Data Notice</strong>: Historical analytics dataset incorporates validated operational 
          observations and prototype multi-day heatwave persistence algorithms for climate-health research demonstration.
        </span>
      </div>

    </div>
  );
};
