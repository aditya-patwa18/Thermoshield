import React from 'react';
import { Building2, HeartPulse, Droplets, Navigation, CheckCircle2 } from 'lucide-react';
import { FacilitiesGroup } from '../../types';

interface InfrastructureListProps {
  facilities: FacilitiesGroup;
  onLocateFacility?: (lat: number, lon: number, name: string) => void;
}

export const InfrastructureList: React.FC<InfrastructureListProps> = ({
  facilities,
  onLocateFacility
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          Nearest Civic Relief Infrastructure
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Proximity-sorted emergency cooling shelters, hospital ERs, and hydration kiosks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Cooling Centers */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Cooling Shelters ({facilities.cooling_centers?.length || 0})
            </span>
          </div>

          <div className="space-y-2">
            {facilities.cooling_centers?.slice(0, 3).map((cc) => (
              <div 
                key={cc.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-white leading-tight">{cc.name}</h5>
                  {cc.distance_km !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 shrink-0">
                      {cc.distance_km < 1 ? `${cc.distance_m}m` : `${cc.distance_km}km`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cc.address}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-medium">{cc.opening_status}</span>
                  <span className="text-slate-400">Cap: {cc.capacity}</span>
                </div>
              </div>
            ))}
            {(!facilities.cooling_centers || facilities.cooling_centers.length === 0) && (
              <div className="text-xs text-slate-500 p-3 bg-slate-950/40 rounded-xl">
                No nearby cooling centers identified within radius.
              </div>
            )}
          </div>
        </div>

        {/* Hospitals */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              Emergency Hospitals ({facilities.hospitals?.length || 0})
            </span>
          </div>

          <div className="space-y-2">
            {facilities.hospitals?.slice(0, 3).map((hosp) => (
              <div 
                key={hosp.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-white leading-tight">{hosp.name}</h5>
                  {hosp.distance_km !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 shrink-0">
                      {hosp.distance_km < 1 ? `${hosp.distance_m}m` : `${hosp.distance_km}km`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{hosp.emergency_capability}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Beds: ~{hosp.approx_capacity}</span>
                  {hosp.has_rapid_cooling_unit && (
                    <span className="text-emerald-400 font-medium">Ice Immersion Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Water Points */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              Hydration Points ({facilities.water_points?.length || 0})
            </span>
          </div>

          <div className="space-y-2">
            {facilities.water_points?.slice(0, 3).map((wp) => (
              <div 
                key={wp.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 hover:border-blue-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-white leading-tight">{wp.name}</h5>
                  {wp.distance_km !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 shrink-0">
                      {wp.distance_km < 1 ? `${wp.distance_m}m` : `${wp.distance_km}km`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{wp.address}</p>
                <div className="mt-2 text-[10px] text-emerald-400">
                  {wp.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
