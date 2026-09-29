import React, { useState } from 'react';
import { Calendar, TrendingUp, Sun, Droplets, Wind, ShieldAlert } from 'lucide-react';
import { ForecastDay } from '../../types';

interface FiveDayForecastProps {
  forecast: ForecastDay[];
}

export const FiveDayForecast: React.FC<FiveDayForecastProps> = ({ forecast }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const selectedDay = forecast[selectedDayIndex] || forecast[0];

  const formatDate = (dateStr: string, idx: number) => {
    if (idx === 0) return 'TODAY';
    if (idx === 1) return 'TOMORROW';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    } catch {
      return `DAY ${idx + 1}`;
    }
  };

  const getBadgeStyle = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'LOW': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MODERATE': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'VERY HIGH': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'EXTREME': return 'bg-red-900/30 text-red-200 border-red-700/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Loading 5-day heat-health outlook...
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            5-Day Heat-Health Trajectory
          </h3>
          <p className="text-xs text-slate-400">
            Click any day to inspect projected thermal strain and operational posture
          </p>
        </div>
      </div>

      {/* 5-Day Interactive Timeline Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {forecast.slice(0, 5).map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <button
              key={day.date || idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-orange-500 ring-2 ring-orange-500/30 shadow-lg'
                  : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {formatDate(day.date, idx)}
              </div>
              
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-white">{day.temp_max}°</span>
                <span className="text-xs text-slate-500">{day.temp_min}°C</span>
              </div>

              <div className="mt-2.5">
                <span className={`inline-block w-full text-center py-1 rounded text-[10px] font-bold uppercase border ${getBadgeStyle(day.risk_category)}`}>
                  {day.risk_category}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>HTSI: {day.htsi_score}</span>
                <span>WBGT: {day.wbgt}°</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail Box */}
      {selectedDay && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                Detailed Projection • {formatDate(selectedDay.date, selectedDayIndex)}
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">
                Projected Heat-Health Impact: {selectedDay.risk_category.toUpperCase()}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Composite Risk:</span>
              <span className="text-xl font-black" style={{ color: selectedDay.color }}>
                {selectedDay.risk_score} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
            <div>
              <span className="text-slate-400">Peak Air Temp:</span>
              <div className="text-base font-bold text-white mt-0.5">{selectedDay.temp_max}°C</div>
            </div>
            <div>
              <span className="text-slate-400">Nocturnal Minimum:</span>
              <div className="text-base font-bold text-white mt-0.5">{selectedDay.temp_min}°C</div>
            </div>
            <div>
              <span className="text-slate-400">Outdoor WBGT:</span>
              <div className="text-base font-bold text-white mt-0.5">{selectedDay.wbgt}°C</div>
            </div>
            <div>
              <span className="text-slate-400">UTCI Equivalent:</span>
              <div className="text-base font-bold text-white mt-0.5">{selectedDay.utci}°C</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
