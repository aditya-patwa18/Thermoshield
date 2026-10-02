import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Globe2, Flame } from 'lucide-react';
import { SystemStatus, LocationInfo } from '../types';
import { loadGoogleMaps } from '../services/googleMaps';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  currentLocation: LocationInfo | null;
  onSelectCity: (cityId: string) => void;
  onSearchCoordinates: (lat: number, lon: number, name: string) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  monitoredCities: any[];
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  currentLocation,
  onSelectCity,
  onSearchCoordinates,
  demoMode,
  onToggleDemoMode,
  monitoredCities
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState<any[]>([]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const onSearchCoordinatesRef = useRef(onSearchCoordinates);
  const googleMapsRef = useRef<any>(null);
  const suggestionRequestRef = useRef(0);

  const worldCities = [
    { name: 'Mumbai, India', lat: 19.076, lon: 72.8777 },
    { name: 'Delhi, India', lat: 28.6139, lon: 77.209 },
    { name: 'Ahmedabad, India', lat: 23.0225, lon: 72.5714 },
    { name: 'Chennai, India', lat: 13.0827, lon: 80.2707 },
    { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    { name: 'New York, USA', lat: 40.7128, lon: -74.006 },
    { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708 }
  ];

  const filteredMonitored = monitoredCities.filter((city) =>
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorld = worldCities.filter((place) =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    onSearchCoordinatesRef.current = onSearchCoordinates;
  }, [onSearchCoordinates]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !searchInputRef.current) return;

    let disposed = false;
    loadGoogleMaps().then((googleMaps) => {
      googleMapsRef.current = googleMaps;
      if (disposed) return;
      setGoogleMapsLoaded(true);
    }).catch(() => undefined);

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    const autocomplete = googleMapsRef.current?.places?.AutocompleteSuggestion;
    const requestId = ++suggestionRequestRef.current;
    if (!googleMapsLoaded || query.length < 3 || !autocomplete) {
      setGoogleSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await autocomplete.fetchAutocompleteSuggestions({ input: query });
        if (requestId === suggestionRequestRef.current) {
          setGoogleSuggestions(response.suggestions || []);
        }
      } catch {
        if (requestId === suggestionRequestRef.current) setGoogleSuggestions([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, googleMapsLoaded]);

  const handleSelectGoogleSuggestion = async (suggestion: any) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });
      if (!place.location) return;

      const label = place.formattedAddress || place.displayName?.text || prediction.text?.text || searchQuery;
      onSearchCoordinatesRef.current(place.location.lat(), place.location.lng(), label);
      setIsOpen(false);
      setSearchQuery('');
      setGoogleSuggestions([]);
    } catch {
      setGoogleSuggestions([]);
    }
  };

  const selectLocalMatch = () => {
    const selectedLocation = [...filteredMonitored, ...filteredWorld][0];
    if (!selectedLocation) return;
    if ('id' in selectedLocation) {
      onSelectCity(selectedLocation.id);
    } else {
      onSearchCoordinates(selectedLocation.lat, selectedLocation.lon, selectedLocation.name);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const googleMaps = googleMapsRef.current;
    if (googleMaps?.Geocoder) {
      const geocoder = new googleMaps.Geocoder();
      geocoder.geocode({ address: trimmed }, (results: any[], status: string) => {
        if (status === 'OK' && results && results[0]?.geometry?.location) {
          const lat = results[0].geometry.location.lat();
          const lon = results[0].geometry.location.lng();
          const name = results[0].formatted_address || trimmed;
          onSearchCoordinates(lat, lon, name);
          setIsOpen(false);
          setSearchQuery('');
        } else {
          selectLocalMatch();
        }
      });
      return;
    }

    selectLocalMatch();
  };

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="z-40 lg:sticky lg:top-0 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-950/30">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg text-white sm:text-xl">ThermalShield</h1>
            </div>
            <div className="text-xs text-slate-400">
              Heat-health early warning
            </div>
          </div>
        </div>

        <div className="relative w-full lg:max-w-2xl lg:flex-1" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearchSubmit();
                } else if (event.key === 'Escape') {
                  setIsOpen(false);
                  event.currentTarget.blur();
                }
              }}
              placeholder="Search a city, address or location..."
              aria-label="Search a city, address or location"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-orange-500/60 focus:outline-none"
            />
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              {googleSuggestions.length > 0 && (
                <div className="border-b border-slate-800 p-2">
                  <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Google Places
                  </div>
                  {googleSuggestions.slice(0, 5).map((suggestion, index) => {
                    const prediction = suggestion.placePrediction;
                    const label = prediction?.text?.text || prediction?.text || `Place ${index + 1}`;
                    return (
                      <button
                        key={prediction?.placeId || index}
                        onClick={() => handleSelectGoogleSuggestion(suggestion)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-orange-400" />
                        <span className="truncate">{String(label)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredMonitored.length > 0 && (
                <div className="border-b border-slate-800 p-2">
                  <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    India
                  </div>
                  {filteredMonitored.slice(0, 6).map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        onSelectCity(city.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span>{city.city}</span>
                      </span>
                      <span className="text-xs text-slate-500">{city.state}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredWorld.length > 0 && (
                <div className="p-2">
                  <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Global
                  </div>
                  {filteredWorld.map((place) => (
                    <button
                      key={place.name}
                      onClick={() => {
                        onSearchCoordinates(place.lat, place.lon, place.name);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-blue-400" />
                        <span>{place.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{place.lat.toFixed(1)}, {place.lon.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              )}

              {googleSuggestions.length === 0 && filteredMonitored.length === 0 && filteredWorld.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No matching location found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-right">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
            Prototype
          </span>
          <span className="text-xs text-slate-400 sm:text-sm">{formattedDate}</span>
        </div>
      </div>
    </header>
  );
};
