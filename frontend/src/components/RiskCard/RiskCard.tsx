import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Users, 
  Info, 
  HelpCircle,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { HealthRiskIntelligence, LocationInfo, PeakPeriod, RiskDriver } from '../../types';

interface RiskCardProps {
  location: LocationInfo;
  healthRisk: HealthRiskIntelligence;
  peakPeriod?: PeakPeriod;
  riskDrivers: RiskDriver[];
  primaryExplanations: string[];
  vulnerabilityScore?: number;
  onExploreVulnerability?: () => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  location,
  healthRisk,
  peakPeriod,
  riskDrivers,
  primaryExplanations,
  vulnerabilityScore = 50,
  onExploreVulnerability
}) => {
  const getBadgeStyle = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'VERY HIGH':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'EXTREME':
        return 'bg-red-900/40 text-red-200 border-red-700/60 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      
      {/* Top Banner: Location & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Operational Target</span>
            {location.is_indian_covered && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PVI Covered
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            {location.name}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Lat: {Math.abs(location.latitude).toFixed(4)}°{location.latitude < 0 ? 'S' : 'N'}, Lon: {Math.abs(location.longitude).toFixed(4)}°{location.longitude < 0 ? 'W' : 'E'}
          </p>
        </div>

        {/* Severity Classification Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-xl text-center border font-bold ${getBadgeStyle(healthRisk.category)}`}>
            <div className="text-[10px] uppercase tracking-wider text-slate-300">Prototype Health Risk</div>
            <div className="text-lg font-black tracking-tight">{healthRisk.category.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Primary Score & Executive Hierarchy */}
      <div className="grid grid-cols-1 gap-4 py-5">
        
        {/* Risk Score Dial / Gauge */}
        <div className="flex min-w-0 flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Aggregate Risk Index
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span 
              className="text-4xl sm:text-5xl font-black tracking-tighter"
              style={{ color: healthRisk.color }}
            >
              {healthRisk.risk_score}
            </span>
            <span className="whitespace-nowrap text-sm sm:text-base font-bold text-slate-500">/ 100</span>
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2 p-0.5">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${healthRisk.risk_score}%`, 
                backgroundColor: healthRisk.color 
              }}
            />
          </div>

          <div className="flex justify-between w-full text-[10px] text-slate-500 font-mono mt-1.5 px-0.5">
            <span>0 Low</span>
            <span>50 Mod</span>
            <span>100 Critical</span>
          </div>
        </div>

        {/* Executive 5-Second Hierarchy (WHEN, WHO, WHY) */}
        <div className="min-w-0 space-y-3">
          
          {/* Summary */}
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {healthRisk.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Peak Risk Window */}
            {peakPeriod && (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Peak Thermal Window
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {peakPeriod.window}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Forecast Peak: <span className="text-orange-400 font-medium">{peakPeriod.peak_temperature_c}°C</span> (HTSI: {peakPeriod.peak_htsi})
                  </div>
                </div>
              </div>
            )}

            {/* Population Vulnerability */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Population Exposure
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  PVI: {vulnerabilityScore} / 100
                </div>
                <div className="text-[11px] text-slate-400">
                  {location.is_indian_covered ? 'Civic vulnerability factored in' : 'Global municipal baseline'}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* WHY THE RISK IS HIGH (Dynamic Explainability Panel) */}
      <div className="pt-4 border-t border-slate-800">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            Key Primary Drivers
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Real-time Environmental Breakdown</span>
        </div>

        {/* Explainability driver score bars */}
        <div className="space-y-2">
          {riskDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <span className="w-36 text-slate-400 truncate shrink-0">{driver.name}</span>
              <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full ${
                    driver.score > 70 ? 'bg-red-500' : driver.score > 40 ? 'bg-orange-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, driver.score))}%` }}
                />
              </div>
              <span className={`w-14 text-right font-mono font-medium ${
                driver.impact === 'High' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {driver.impact}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic sentences */}
        <div className="mt-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <ul className="space-y-1">
            {primaryExplanations.map((exp, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mandatory Transparent Disclaimer (Section 22 & 50) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Methodology Transparency</strong>: {healthRisk.disclaimer} Operational index calculated 
          via deterministic multi-variable biometeorological modeling.
        </span>
      </div>

    </div>
  );
};
