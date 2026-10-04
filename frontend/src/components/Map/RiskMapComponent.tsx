import React, { useEffect, useState } from 'react';
import { Layers, Building2, Flame, ShieldAlert, Crosshair } from 'lucide-react';
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LocationInfo, FacilitiesGroup } from '../../types';

interface RiskMapProps {
  currentLocation: LocationInfo | null;
  monitoredCities: any[];
  facilities: FacilitiesGroup | null;
  wardsGeoJSON: any | null;
  activeLayer: 'risk' | 'thermal' | 'vulnerability' | 'infrastructure';
  onLayerChange: (layer: 'risk' | 'thermal' | 'vulnerability' | 'infrastructure') => void;
  onSelectLocation: (lat: number, lon: number, name?: string) => void;
  heightClass?: string;
  legendClass?: string;
}

interface MapInteractionProps {
  center: { lat: number; lng: number };
  zoom: number;
  onSelectLocation: (lat: number, lon: number) => void;
}

const MapInteraction: React.FC<MapInteractionProps> = ({ center, zoom, onSelectLocation }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);

  useMapEvents({
    click: (event) => onSelectLocation(event.latlng.lat, event.latlng.lng)
  });

  return null;
};

export const RiskMapComponent: React.FC<RiskMapProps> = ({
  currentLocation,
  monitoredCities,
  facilities,
  wardsGeoJSON,
  activeLayer,
  onLayerChange,
  onSelectLocation,
  heightClass = 'h-[500px]',
  legendClass = ''
}) => {
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const center = currentLocation
    ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
    : { lat: 19.076, lng: 72.8777 };

  const zoom = currentLocation
    ? currentLocation.id === 'mumbai' || currentLocation.ward
      ? 12
      : currentLocation.is_indian_covered
        ? 10
        : 8
    : 6;

  const layerOptions = [
    { id: 'risk', label: 'Heat Risk', icon: ShieldAlert },
    { id: 'thermal', label: 'Thermal Stress', icon: Flame },
    { id: 'vulnerability', label: 'Vulnerability', icon: Layers },
    { id: 'infrastructure', label: 'Cooling Centers', icon: Building2 }
  ] as const;

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950`}>
      <div className="absolute left-4 top-4 z-[500]">
        <button
          onClick={() => setShowLayerMenu((open) => !open)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur"
        >
          <Layers className="h-3.5 w-3.5 text-orange-400" />
          <span>Layers</span>
        </button>

        {showLayerMenu && (
          <div className="mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur">
            {layerOptions.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    onLayerChange(layer.id);
                    setShowLayerMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="z-0 h-full w-full">
        <MapInteraction center={center} zoom={zoom} onSelectLocation={onSelectLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {wardsGeoJSON && <GeoJSON data={wardsGeoJSON as any} style={{ color: '#fdba74', weight: 1, fillOpacity: 0.04 }} />}
        {monitoredCities.map((city) => {
          const isSelected = currentLocation?.id === city.id;
          return (
            <CircleMarker
              key={city.id}
              center={[city.latitude, city.longitude]}
              radius={isSelected ? 10 : 7}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: isSelected ? '#ffffff' : '#f97316', fillOpacity: 1 }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  onSelectLocation(city.latitude, city.longitude, `${city.city}, ${city.state}`);
                }
              }}
            >
              <Popup>{city.city}, {city.state}</Popup>
            </CircleMarker>
          );
        })}
        {activeLayer === 'infrastructure' && facilities?.cooling_centers?.map((item) => (
          <CircleMarker key={item.id} center={[item.latitude, item.longitude]} radius={8} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#06b6d4', fillOpacity: 1 }}>
            <Popup>{item.name}</Popup>
          </CircleMarker>
        ))}
        {activeLayer === 'infrastructure' && facilities?.hospitals?.map((item) => (
          <CircleMarker key={item.id} center={[item.latitude, item.longitude]} radius={8} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#f43f5e', fillOpacity: 1 }}>
            <Popup>{item.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className={`absolute z-[500] max-w-xs rounded-xl ${legendClass || 'bottom-4 left-4'} border border-slate-700 bg-slate-900/90 p-3 shadow-2xl backdrop-blur`}>
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          <span>Heat risk</span>
          <span className="text-slate-500">Deterministic</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          <div className="flex flex-col items-center">
            <span className="mb-1 h-2 w-full rounded bg-emerald-500" />
            <span className="text-[9px] text-slate-300">Low</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 h-2 w-full rounded bg-amber-500" />
            <span className="text-[9px] text-slate-300">Mod</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 h-2 w-full rounded bg-orange-500" />
            <span className="text-[9px] text-slate-300">High</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 h-2 w-full rounded bg-red-500" />
            <span className="text-[9px] text-slate-300">Very High</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 h-2 w-full rounded bg-red-900" />
            <span className="text-[9px] text-slate-300">Extreme</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><Crosshair className="h-3 w-3 text-orange-400" /> Click to inspect</span>
          <span>India support</span>
        </div>
      </div>
    </div>
  );
};
