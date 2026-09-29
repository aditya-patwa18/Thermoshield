import React from 'react';
import { TrendingUp, Calendar, Clock, Sun, Flame, Wind, Droplets } from 'lucide-react';
import { DashboardData } from '../types';
import { FiveDayForecast } from '../components/Forecast/FiveDayForecast';
import { HourlyForecastChart } from '../components/Forecast/HourlyForecastChart';

interface ForecastPageProps {
  dashboardData: DashboardData | null;
}

export const Forecast: React.FC<ForecastPageProps> = ({ dashboardData }) => {
  if (!dashboardData) {
    return <div className="text-center p-8 text-slate-400">Loading forecast intelligence...</div>;
  }

  const { forecast_5d, hourly_24h, peak_risk_period, location } = dashboardData;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          Multi-Day Thermal-Health Outlook & Diurnal Curves
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          5-day risk trajectory and hourly physiological heat load analysis for {location.name}
        </p>
      </div>

      {/* 24-Hour Diurnal Chart */}
      <HourlyForecastChart
        hourlyData={hourly_24h}
        peakPeriod={peak_risk_period}
      />

      {/* 5-Day Outlook */}
      <FiveDayForecast forecast={forecast_5d} />

      {/* Detailed Forecast Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
          Comprehensive 5-Day Biometeorological Parameters Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Max Temp</th>
                <th className="py-2.5 px-3">Night Min</th>
                <th className="py-2.5 px-3">Humidity Avg</th>
                <th className="py-2.5 px-3">Max Wind</th>
                <th className="py-2.5 px-3">WBGT</th>
                <th className="py-2.5 px-3">UTCI</th>
                <th className="py-2.5 px-3">HTSI</th>
                <th className="py-2.5 px-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {forecast_5d.map((d, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-white">{d.date}</td>
                  <td className="py-3 px-3 text-red-400 font-bold">{d.temp_max}°C</td>
                  <td className="py-3 px-3 text-slate-400">{d.temp_min}°C</td>
                  <td className="py-3 px-3 text-blue-400">{d.humidity_avg}%</td>
                  <td className="py-3 px-3 text-cyan-400">{d.wind_speed_ms} m/s</td>
                  <td className="py-3 px-3 text-amber-400 font-bold">{d.wbgt}°C</td>
                  <td className="py-3 px-3 text-purple-400">{d.utci}°C</td>
                  <td className="py-3 px-3 text-orange-400 font-bold">{d.htsi_score}</td>
                  <td className="py-3 px-3 font-sans">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ color: d.color, backgroundColor: `${d.color}20` }}
                    >
                      {d.risk_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
