import React, { useEffect, useRef, useState } from 'react';
import { HeatFieldCity } from '../../types';

interface HeatFieldProps {
  cities: HeatFieldCity[];
  selectedId: string | null;
  onSelect: (cityId: string) => void;
}

type FieldHandle = ReturnType<typeof import('../../three/heatField.js')['createHeatField']>;

/**
 * 3D view of heat stress across the monitored cities. The Three.js scene lives in
 * src/three/heatField.js and is loaded on demand so it never delays the dashboard.
 */
export const HeatField: React.FC<HeatFieldProps> = ({ cities, selectedId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<FieldHandle | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    import('../../three/heatField.js')
      .then(({ createHeatField }) => {
        if (cancelled || !containerRef.current) return;
        fieldRef.current = createHeatField(containerRef.current, {
          onSelect: (id: string) => onSelectRef.current(id),
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        });
        setReady(true);
      })
      .catch((e) => {
        // WebGL can be missing or blocked; the city list beside the scene still works.
        console.error('3D heat field unavailable:', e);
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
      fieldRef.current?.dispose();
      fieldRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !cities.length) return;
    fieldRef.current?.setCities(
      cities.map((city) => ({
        id: city.id,
        name: city.city,
        lat: city.latitude,
        lon: city.longitude,
        heat: city.htsi,
        temperature: city.temperature_c,
        humidity: city.relative_humidity
      }))
    );
  }, [ready, cities]);

  useEffect(() => {
    if (ready) fieldRef.current?.setSelected(selectedId);
  }, [ready, selectedId, cities]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="3D view of India's monitored cities. Each column's height and colour show that city's heat stress index."
      className="absolute inset-0"
    >
      {unavailable && (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
          The 3D view needs WebGL, which this browser has switched off. Pick a city from the list instead.
        </div>
      )}
    </div>
  );
};
