import React, { useState } from 'react';
import { 
  Map as MapIcon, 
  MapPin, 
  ShieldAlert, 
  Users,
  Filter
} from 'lucide-react';
import { DashboardData } from '../types';
import { RiskMapComponent } from '../components/Map/RiskMapComponent';
import { RiskCard } from '../components/RiskCard/RiskCard';

interface RiskMapPageProps {
  dashboardData: DashboardData | null;
  monitoredCities: any[];
  wardsGeoJSON: any | null;
  onSelectCity: (cityId: string) => void;
  onSelectCoords: (lat: number, lon: number, name?: string) => void;
}

export const RiskMap: React.FC<RiskMapPageProps> = ({
  dashboardData,
  monitoredCities,
  wardsGeoJSON,
  onSelectCity,
  onSelectCoords
}) => {
  const [activeLayer, setActiveLayer] = useState<'risk' | 'thermal' | 'vulnerability' | 'infrastructure'>('risk');
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = monitoredCities.filter(c =>
    c.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-orange-400" />
            Live Geospatial Risk Map & Ward Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time thermal stress, prototype health risk, and municipal ward vulnerability overlays
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Full Interactive Map */}
        <div className="lg:col-span-8 space-y-4">
          <RiskMapComponent
            currentLocation={dashboardData?.location || null}
            monitoredCities={monitoredCities}
            facilities={dashboardData?.nearby_facilities || null}
            wardsGeoJSON={wardsGeoJSON}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            onSelectLocation={onSelectCoords}
            heightClass="h-[640px]"
          />

          {/* Quick Monitored City Selector Ribbon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-400" />
                Monitored Cities Quick Switch ({filtered.length})
              </span>
              <input
                type="text"
                placeholder="Filter cities..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 w-44"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {filtered.map((city) => (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                    dashboardData?.location?.id === city.id
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold">{city.city}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({city.state})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Location / Ward Detail Panel */}
        <div className="lg:col-span-4 space-y-4">
          {dashboardData && (
            <RiskCard
              location={dashboardData.location}
              healthRisk={dashboardData.health_risk}
              peakPeriod={dashboardData.peak_risk_period}
              riskDrivers={dashboardData.risk_drivers}
              primaryExplanations={dashboardData.primary_explanations}
              vulnerabilityScore={dashboardData.vulnerability?.score}
            />
          )}

          {/* Ward Deep Dive if applicable */}
          {dashboardData?.location?.ward && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Active Ward Demographics
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Ward Unit:</span>
                  <span className="font-bold text-white">{dashboardData.location.ward.ward_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Population:</span>
                  <span className="font-mono text-white">{(dashboardData.location.ward.population || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Density:</span>
                  <span className="font-mono text-white">{(dashboardData.location.ward.population_density || 0).toLocaleString()} /km²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Outdoor Worker Share:</span>
                  <span className="font-mono text-orange-400">{dashboardData.location.ward.outdoor_worker_percent}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Elderly Cohort:</span>
                  <span className="font-mono text-rose-400">{dashboardData.location.ward.elderly_percent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Cooling Shelters:</span>
                  <span className="font-mono text-cyan-400">{dashboardData.location.ward.cooling_centers} Designated</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
