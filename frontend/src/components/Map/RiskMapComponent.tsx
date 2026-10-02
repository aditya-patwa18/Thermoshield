import React, { useEffect, useRef, useState } from 'react';
import { Layers, Building2, Flame, ShieldAlert, Crosshair } from 'lucide-react';
import { LocationInfo, FacilitiesGroup } from '../../types';
import { loadGoogleMaps, onGoogleMapsAuthFailure } from '../../services/googleMaps';

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

// Dark enough to sit in the dashboard, but land, sea, roads and place names each get
// their own tone so the map can be read: the markers still need a geography under them.
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#3d3758' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#ece8f3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1728' }, { weight: 3 }] },

  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#3d3758' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#36405a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#2f4a4c' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#15395c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8fb8de' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#5b5478' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#28233a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#6f6790' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#a79cc9' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#28233a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#d9d3e6' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#4f4870' }] },

  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#bcb3cf' }, { weight: 1 }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#d9d3e6' }] }
];

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onSelectLocationRef = useRef(onSelectLocation);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

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

  useEffect(() => {
    if (!mapRef.current) return;

    let disposed = false;
    const authFailure = () => {
      setMapError('Google Maps rejected the API key. Check Maps JavaScript API, billing, and localhost referrer restrictions.');
    };
    const unsubscribeAuthFailure = onGoogleMapsAuthFailure(authFailure);

    loadGoogleMaps().then((googleMaps) => {
      if (disposed) return;
      if (!mapRef.current || !googleMaps) return;
      const map = new googleMaps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: mapStyles
      });

      mapInstanceRef.current = map;
      map.addListener('click', (event: any) => {
        if (event.latLng) {
          onSelectLocationRef.current(event.latLng.lat(), event.latLng.lng());
        }
      });

      setMapReady(true);
      setMapError(null);
    }).catch(() => {
      if (!disposed) {
        setMapError('Google Maps could not load. Check the API key, enabled APIs, billing, and network access.');
      }
    });

    return () => {
      disposed = true;
      unsubscribeAuthFailure();
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const googleMaps: any = (window as any).google?.maps;
    if (!googleMaps) return;
    const target = new googleMaps.LatLng(center.lat, center.lng);
    mapInstanceRef.current.panTo(target);
    mapInstanceRef.current.setZoom(zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const googleMaps: any = (window as any).google?.maps;
    if (!googleMaps) return;

    monitoredCities.forEach((city) => {
      const isSelected = currentLocation?.id === city.id;
      const marker = new googleMaps.Marker({
        position: { lat: city.latitude, lng: city.longitude },
        map: mapInstanceRef.current ?? undefined,
        title: `${city.city}, ${city.state}`,
        label: {
          text: city.city.substring(0, 2).toUpperCase(),
          color: isSelected ? '#0f0d1a' : '#ffffff',
          fontSize: '10px',
          fontWeight: '700'
        },
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: isSelected ? 13 : 10,
          fillColor: isSelected ? '#ffffff' : '#f97316',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        onSelectLocation(city.latitude, city.longitude, `${city.city}, ${city.state}`);
      });

      markersRef.current.push(marker);
    });

    if (facilities && (activeLayer === 'infrastructure' || zoom >= 11)) {
      facilities.cooling_centers?.forEach((centerItem) => {
        const marker = new googleMaps.Marker({
          position: { lat: centerItem.latitude, lng: centerItem.longitude },
          map: mapInstanceRef.current ?? undefined,
          title: centerItem.name,
          label: { text: 'CC', color: '#fff', fontSize: '10px', fontWeight: '700' },
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#06b6d4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        markersRef.current.push(marker);
      });

      facilities.hospitals?.forEach((hospital) => {
        const marker = new googleMaps.Marker({
          position: { lat: hospital.latitude, lng: hospital.longitude },
          map: mapInstanceRef.current ?? undefined,
          title: hospital.name,
          label: { text: 'H', color: '#fff', fontSize: '10px', fontWeight: '700' },
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#f43f5e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        markersRef.current.push(marker);
      });
    }
  }, [mapReady, monitoredCities, facilities, currentLocation, activeLayer, zoom]);

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

      <div ref={mapRef} className="h-full w-full" />

      {(!mapReady || mapError) && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-950/90 p-6 text-center text-sm text-slate-300">
          <div className="max-w-md">
            <div className="font-semibold text-white">{mapError ? 'Map unavailable' : 'Loading Google Maps...'}</div>
            {mapError && <p className="mt-2 text-xs leading-relaxed text-slate-400">{mapError}</p>}
          </div>
        </div>
      )}

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
