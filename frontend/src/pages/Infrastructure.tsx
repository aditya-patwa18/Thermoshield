import React, { useState } from 'react';
import { Building2, HeartPulse, Droplets, MapPin, Search, Phone, CheckCircle2, Navigation } from 'lucide-react';
import { DashboardData } from '../types';
import { InfrastructureList } from '../components/Infrastructure/InfrastructureList';

interface InfrastructurePageProps {
  dashboardData: DashboardData | null;
  onLocate: (lat: number, lon: number, name: string) => void;
}

export const Infrastructure: React.FC<InfrastructurePageProps> = ({
  dashboardData,
  onLocate
}) => {
  const [filterType, setFilterType] = useState<'all' | 'cooling' | 'hospital' | 'water'>('all');

  if (!dashboardData) {
    return <div className="text-center p-8 text-slate-400">Loading infrastructure data...</div>;
  }

  const { nearby_facilities, location } = dashboardData;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          Civic Heat Relief & Healthcare Infrastructure
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Designated cooling centers, acute heat-stroke hospital wards, and emergency water kiosks near {location.name}
        </p>
      </div>

      {/* Proximity Summary */}
      <InfrastructureList
        facilities={nearby_facilities}
        onLocateFacility={onLocate}
      />

      {/* All Facilities Detail Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Local Facility Operational Directory
          </h3>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'all' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('cooling')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'cooling' ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}
            >
              Cooling Centers
            </button>
            <button
              onClick={() => setFilterType('hospital')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'hospital' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
            >
              Hospitals
            </button>
            <button
              onClick={() => setFilterType('water')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${filterType === 'water' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
            >
              Water Points
            </button>
          </div>
        </div>

        {/* Directory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {(filterType === 'all' || filterType === 'cooling') && nearby_facilities.cooling_centers?.map((cc) => (
            <div key={cc.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Cooling Shelter</span>
                  {cc.distance_km !== undefined && (
                    <span className="text-xs font-mono text-cyan-300 font-bold">{cc.distance_km} km</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{cc.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{cc.address}</p>
                <div className="mt-2 text-xs text-emerald-400 font-medium">{cc.opening_status}</div>
                <div className="mt-1 text-[11px] text-slate-400">Capacity: {cc.capacity} individuals</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                {cc.amenities?.map((am, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {am}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {(filterType === 'all' || filterType === 'hospital') && nearby_facilities.hospitals?.map((h) => (
            <div key={h.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Emergency Hospital</span>
                  {h.distance_km !== undefined && (
                    <span className="text-xs font-mono text-rose-300 font-bold">{h.distance_km} km</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{h.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{h.address}</p>
                <div className="mt-2 text-xs text-amber-300 font-medium">{h.emergency_capability}</div>
                <div className="mt-1 text-[11px] text-slate-400">Bed Capacity: ~{h.approx_capacity} beds</div>
                {h.phone && <div className="text-[11px] text-slate-400 font-mono mt-0.5">Emergency: {h.phone}</div>}
              </div>
              {h.has_rapid_cooling_unit && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-bold">
                  ✓ Rapid Cold-Water Immersion Tubs Ready
                </div>
              )}
            </div>
          ))}

          {(filterType === 'all' || filterType === 'water') && nearby_facilities.water_points?.map((wp) => (
            <div key={wp.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Hydration Kiosk</span>
                  {wp.distance_km !== undefined && (
                    <span className="text-xs font-mono text-blue-300 font-bold">{wp.distance_km} km</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{wp.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{wp.address}</p>
                <div className="mt-2 text-xs text-emerald-400">{wp.status}</div>
              </div>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};
