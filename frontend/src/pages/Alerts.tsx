import React from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  Send, 
  ShieldAlert, 
  Building2, 
  Users,
  Flame,
  Clock
} from 'lucide-react';
import { DashboardData, ActiveAlert, SystemStatus } from '../types';

interface AlertsPageProps {
  dashboardData: DashboardData | null;
  activeAlerts: ActiveAlert[];
  systemStatus: SystemStatus | null;
  onOpenAlertModal: () => void;
}

export const Alerts: React.FC<AlertsPageProps> = ({
  dashboardData,
  activeAlerts,
  systemStatus,
  onOpenAlertModal
}) => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-500 animate-pulse" />
            Municipal Alert Command Center & Early Warning
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active heat warnings, multi-channel broadcast center (SMS, WhatsApp, Email), and municipal preparedness
          </p>
        </div>

        <button
          onClick={onOpenAlertModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-all self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Emergency Alert</span>
        </button>
      </div>

      {/* Municipal Operational Metrics (Section 39) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Jurisdictions Monitored</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">26</div>
          <div className="text-[10px] text-slate-500">Major metropolitan regions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Locations High+ Risk</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">8</div>
          <div className="text-[10px] text-slate-500">Exceeding safe outdoor limit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Critical Extreme Warning</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-500 mt-2">2</div>
          <div className="text-[10px] text-slate-500">Delhi NCR, Ahmedabad</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Population Exposed</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">34.8M</div>
          <div className="text-[10px] text-slate-500">Under active advisory</div>
        </div>

      </div>

      {/* Active Alerts Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Warning Directives ({activeAlerts.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Live Synchronized</span>
        </div>

        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div 
              key={alert.alert_id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${
                alert.severity === 'EXTREME'
                  ? 'bg-red-950/30 border-red-800/60'
                  : alert.severity === 'VERY HIGH'
                  ? 'bg-orange-950/20 border-orange-800/50'
                  : 'bg-amber-950/20 border-amber-800/40'
              }`}
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    alert.severity === 'EXTREME' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{alert.location}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Valid Until: {alert.valid_until ? new Date(alert.valid_until).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">{alert.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.message}</p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {alert.actions?.map((act, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-800">
                      ✓ {act}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenAlertModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors shrink-0 self-start border border-slate-700"
              >
                Forward Alert
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Area Prioritization (Section 39) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Operational Jurisdictional Prioritization List
          </h3>
          <p className="text-xs text-slate-400">
            Ranked municipal mobilization priority based on thermal strain, nocturnal heat, and population vulnerability
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          <div className="bg-slate-950/80 border border-red-900/60 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">1. Delhi NCR</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Peak Temp 44.0°C • HTSI 88</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
              EXTREME
            </span>
          </div>

          <div className="bg-slate-950/80 border border-red-900/60 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">2. Ahmedabad</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Peak Temp 42.8°C • HTSI 84</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
              EXTREME
            </span>
          </div>

          <div className="bg-slate-950/80 border border-orange-900/50 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">3. Mumbai MMR</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Temp 37.2°C • Hum 76% • HTSI 79</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
              VERY HIGH
            </span>
          </div>

          <div className="bg-slate-950/80 border border-orange-900/50 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">4. Nagpur</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Peak Temp 41.5°C • HTSI 76</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
              VERY HIGH
            </span>
          </div>

        </div>

        <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
          <strong>Note</strong>: This is an operational resource prioritization ranking based on system scores, not a political or evaluative evaluation.
        </div>
      </div>

    </div>
  );
};
