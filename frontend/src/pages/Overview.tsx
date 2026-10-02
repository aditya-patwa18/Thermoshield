import React from 'react';
import { ArrowRight, BellRing, Flame, ShieldAlert, SunMedium } from 'lucide-react';
import { DashboardData, HeatFieldData } from '../types';
import { RiskMapComponent } from '../components/Map/RiskMapComponent';
import { HeatField } from '../components/HeatField/HeatField';
import { HEAT_RAMP, heatColor } from '../three/heatRamp.js';

interface OverviewPageProps {
  dashboardData: DashboardData | null;
  heatField: HeatFieldData | null;
  selectedCityId: string | null;
  updatingLabel: string | null;
  monitoredCities: any[];
  wardsGeoJSON: any | null;
  onNavigateTab: (tab: any) => void;
  onSelectCity: (cityId: string) => void;
  onSelectCoords: (lat: number, lon: number, name?: string) => void;
  onOpenAlertModal: () => void;
}

const severityClasses: Record<string, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  Moderate: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  High: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  'Very High': 'bg-red-500/15 text-red-300 border border-red-500/30',
  Extreme: 'bg-red-900/30 text-red-200 border border-red-700/40'
};

const panelClass = 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5';
const panelTitleClass = 'text-sm font-semibold text-slate-100';

export const Overview: React.FC<OverviewPageProps> = ({
  dashboardData,
  heatField,
  selectedCityId,
  updatingLabel,
  monitoredCities,
  wardsGeoJSON,
  onNavigateTab,
  onSelectCity,
  onSelectCoords,
  onOpenAlertModal
}) => {
  const [activeMapLayer, setActiveMapLayer] = React.useState<'risk' | 'thermal' | 'vulnerability' | 'infrastructure'>('risk');
  const [audience, setAudience] = React.useState<'public' | 'municipal'>('public');

  if (!dashboardData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">
            Updating weather, thermal stress and health risk...
          </p>
        </div>
      </div>
    );
  }

  const { location, weather, thermal, health_risk, forecast_5d, peak_risk_period, risk_drivers, recommended_actions, nearby_facilities, vulnerability } = dashboardData;

  const currentAlert = dashboardData.alerts?.[0];
  const meaningfulDrivers = (risk_drivers || []).filter((d) => d.name !== 'Baseline Metrics');
  const riskDriversSummary = meaningfulDrivers.slice(0, 3);
  const explanations = (dashboardData.primary_explanations || []).slice(0, 3);

  const publicCategories = new Set(['Public Alert', 'Targeted Outreach', 'Cooling Shelter']);
  const liveActions = recommended_actions || [];
  const audienceActions = liveActions.filter((a) => publicCategories.has(a.category) === (audience === 'public'));
  const actionList = (audienceActions.length ? audienceActions : liveActions).slice(0, 4).map((a) => ({
    key: a.title,
    title: a.title,
    detail: a.description
  }));
  const fallbackActions = (audience === 'public'
    ? ['Stay hydrated', 'Avoid prolonged afternoon exposure', 'Check on vulnerable residents']
    : ['Prepare cooling centers', 'Alert healthcare facilities', 'Adjust outdoor work schedules']
  ).map((t) => ({ key: t, title: t, detail: '' }));
  const actionsToShow = actionList.length ? actionList : fallbackActions;

  const fieldCities = heatField?.cities ?? [];
  const hottest = fieldCities
    .filter((city) => city.htsi !== null)
    .sort((a, b) => (b.htsi ?? 0) - (a.htsi ?? 0))
    .slice(0, 6);
  const fieldUpdated = heatField
    ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(heatField.updated_at))
    : null;

  const [placeName, ...placeRest] = location.name.split(',');
  const placeRegion = placeRest.join(',').trim() || location.state;
  // Ward and custom place names run long: step the headline down so it never crowds the scene.
  const titleSize = placeName.length <= 12 ? 'text-4xl sm:text-5xl lg:text-6xl' : placeName.length <= 24 ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl';
  const feelsLike = Number(thermal?.heat_index?.value || weather.current.temperature_c + 4).toFixed(1);
  const heroFacts = [
    { label: 'Health risk score', value: `${Math.round(health_risk.risk_score)}`, unit: '/ 100' },
    { label: 'Heat stress index', value: `${Math.round(thermal.htsi)}`, unit: '/ 100' },
    { label: 'Air temperature', value: weather.current.temperature_c.toFixed(1), unit: '°C' },
    { label: 'Feels like', value: feelsLike, unit: '°C' }
  ];

  return (
    <div className="space-y-5 pb-12">
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950">
        <div className="relative">
          <div className="relative h-[380px] sm:h-[480px] lg:h-[620px]">
            <HeatField cities={fieldCities} selectedId={selectedCityId} onSelect={onSelectCity} />
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent lg:block" />

            <p className="pointer-events-none absolute left-5 top-5 max-w-[30ch] text-sm leading-snug text-slate-300 lg:left-8 lg:top-7">
              {heatField && !hottest.length
                ? 'Live readings for the monitored cities are unavailable right now.'
                : `Heat stress across ${fieldCities.length || monitoredCities.length} monitored cities${fieldUpdated ? `, updated ${fieldUpdated}` : ''}. Drag to rotate, select a column to open that city.`}
            </p>

            <div className="pointer-events-none absolute bottom-4 right-4 w-56 lg:bottom-6 lg:right-6 lg:w-64">
              <div className="flex gap-1">
                {HEAT_RAMP.map((stop) => (
                  <div key={stop.label} className="flex-1">
                    <span className="block h-1.5 rounded-sm" style={{ background: stop.color }} />
                    <span className="mt-1 block text-[10px] leading-tight text-slate-300">{stop.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Column height and colour show the heat stress index.</p>
            </div>
          </div>

          <div
            aria-busy={Boolean(updatingLabel)}
            className={`p-5 transition-opacity lg:pointer-events-none lg:absolute lg:bottom-8 lg:left-8 lg:p-0 ${updatingLabel ? 'opacity-60' : ''}`}
          >
            <p role="status" className="text-sm text-slate-400">
              {updatingLabel ? (
                <span className="inline-flex items-center gap-2 text-slate-200">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                  {updatingLabel}
                </span>
              ) : (
                placeRegion
              )}
            </p>
            <h2 className={`font-display mt-1 max-w-[16ch] text-white ${titleSize}`}>{placeName}</h2>
            <p className="mt-3 flex max-w-[36ch] items-start gap-2.5 text-lg leading-snug text-slate-200">
              <span
                aria-hidden="true"
                className="mt-2 h-3 w-3 shrink-0 rounded-sm"
                style={{ background: heatColor(thermal.htsi) }}
              />
              <span>
                {health_risk.category} heat-health risk right now. Heat stress peaks around {peak_risk_period.window}.
              </span>
            </p>

            <dl className="mt-5 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {heroFacts.map((fact) => (
                <div key={fact.label} className="border-l border-slate-700 pl-3">
                  <dt className="text-xs text-slate-400">{fact.label}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-2xl font-semibold text-white">
                    {fact.value}
                    <span className="ml-1 text-sm font-normal text-slate-400">{fact.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2 lg:pointer-events-auto">
              <button
                onClick={onOpenAlertModal}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <BellRing className="h-4 w-4" />
                Send a heat alert
              </button>
              <button
                onClick={() => onNavigateTab('forecast')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-slate-400"
              >
                See the hourly forecast
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 p-4 lg:flex lg:items-center lg:gap-6 lg:px-8">
          <div className="shrink-0">
            <h3 className={panelTitleClass}>Hottest right now</h3>
            <p className="text-xs text-slate-400">Heat stress index, 0 to 100</p>
          </div>

          {hottest.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400 lg:mt-0">
              {heatField ? 'No live readings. Search for a city above to open it.' : 'Loading city readings...'}
            </p>
          ) : (
            <ol className="mt-3 grid flex-1 grid-cols-2 gap-1 sm:grid-cols-3 lg:mt-0 lg:grid-cols-6">
              {hottest.map((city) => {
                const isSelected = city.id === selectedCityId;
                return (
                  <li key={city.id}>
                    <button
                      onClick={() => onSelectCity(city.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full rounded-lg px-2.5 py-2 text-left ${isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                    >
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-100">{city.city}</span>
                        <span className="text-slate-300">{Math.round(city.htsi ?? 0)}</span>
                      </span>
                      <span className="mt-1.5 block h-1 rounded-full bg-slate-800">
                        <span
                          className="block h-1 rounded-full"
                          style={{ width: `${city.htsi}%`, background: heatColor(city.htsi) }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className={panelTitleClass}>Next five days</h3>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-xs text-slate-300 hover:text-white"
            >
              Full forecast
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {forecast_5d.slice(0, 5).map((day, idx) => (
              <div key={day.date || idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">
                  {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `Day ${idx + 1}`}
                </div>
                <div className="mt-2 text-xl font-semibold text-white">{day.temp_max}°</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="h-2 w-2 rounded-sm" style={{ background: heatColor(day.htsi_score) }} />
                  {day.risk_category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={panelClass}>
          <h3 className={panelTitleClass}>Why the risk is {health_risk.category.toLowerCase()}</h3>
          <div className="mt-4 space-y-3">
            {riskDriversSummary.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                {explanations[0] || 'No elevated risk drivers detected for this location right now.'}
              </div>
            )}
            {riskDriversSummary.map((driver) => (
              <div key={driver.name} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{driver.name}</div>
                  <div className="text-xs text-slate-400">{driver.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <RiskMapComponent
          currentLocation={location}
          monitoredCities={monitoredCities}
          facilities={nearby_facilities}
          wardsGeoJSON={wardsGeoJSON}
          activeLayer={activeMapLayer}
          onLayerChange={setActiveMapLayer}
          onSelectLocation={onSelectCoords}
          heightClass="h-[440px]"
          legendClass="hidden bottom-4 right-16 lg:block"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className={panelTitleClass}>What to do now</h3>
            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs text-slate-400">
              <button
                onClick={() => setAudience('public')}
                aria-pressed={audience === 'public'}
                className={`rounded-md px-2.5 py-1 ${audience === 'public' ? 'bg-slate-800 text-white' : ''}`}
              >
                Public
              </button>
              <button
                onClick={() => setAudience('municipal')}
                aria-pressed={audience === 'municipal'}
                className={`rounded-md px-2.5 py-1 ${audience === 'municipal' ? 'bg-slate-800 text-white' : ''}`}
              >
                Municipal
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {actionsToShow.map((action, index) => (
              <div key={action.key} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                  {index % 3 === 0 ? <SunMedium className="h-3.5 w-3.5" /> : index % 3 === 1 ? <ShieldAlert className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <div className="text-sm text-slate-200">{action.title}</div>
                  {action.detail && <div className="mt-0.5 text-xs text-slate-500">{action.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={panelClass}>
          <h3 className={panelTitleClass}>Population vulnerability</h3>
          <div className="mt-5 flex items-end gap-2">
            <div className="text-4xl font-semibold text-white">{vulnerability?.score ?? 0}</div>
            <div className="pb-1 text-sm text-slate-400">/ 100</div>
          </div>
          <div className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${severityClasses[vulnerability?.category || ''] || severityClasses.High}`}>
            {vulnerability?.category || 'Baseline'}
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('vulnerability')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white"
            >
              View vulnerability
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {currentAlert && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium text-orange-300">Heat alert in effect</div>
              <div className="mt-1 text-lg font-semibold text-white">{currentAlert.title}</div>
            </div>
            <button
              onClick={onOpenAlertModal}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/20"
            >
              Send this alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
