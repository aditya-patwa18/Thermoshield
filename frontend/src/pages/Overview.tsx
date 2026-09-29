import React from 'react';
import { ArrowRight, BellRing, Flame, MapPin, ShieldAlert, SunMedium } from 'lucide-react';
import { DashboardData } from '../types';
import { RiskMapComponent } from '../components/Map/RiskMapComponent';

interface OverviewPageProps {
  dashboardData: DashboardData | null;
  monitoredCities: any[];
  wardsGeoJSON: any | null;
  onNavigateTab: (tab: any) => void;
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

export const Overview: React.FC<OverviewPageProps> = ({
  dashboardData,
  monitoredCities,
  wardsGeoJSON,
  onNavigateTab,
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

  return (
    <div className="space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_20px_70px_rgba(15,23,42,0.6)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="relative">
          <RiskMapComponent
            currentLocation={location}
            monitoredCities={monitoredCities}
            facilities={nearby_facilities}
            wardsGeoJSON={wardsGeoJSON}
            activeLayer={activeMapLayer}
            onLayerChange={setActiveMapLayer}
            onSelectLocation={onSelectCoords}
            heightClass="h-[620px]"
            legendClass="hidden bottom-4 right-16 lg:block"
          />

          <div className="pointer-events-none absolute inset-y-0 left-0 w-44 bg-gradient-to-r from-slate-950/25 to-transparent" />

          <div className="pointer-events-none absolute bottom-5 left-5 w-[min(28rem,calc(100%-2.5rem))] sm:bottom-6 sm:left-6">
            <div className="pointer-events-auto rounded-2xl border border-slate-700 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-orange-400" />
                    {location.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{location.state || 'Global location'}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${severityClasses[health_risk.category] || severityClasses.High}`}>
                  {health_risk.category}
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <div className="text-5xl font-semibold tracking-[-0.08em] text-white">{health_risk.risk_score}</div>
                <div className="pb-1 text-sm text-slate-400">/ 100</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Temperature</div>
                  <div className="mt-1 text-lg font-semibold text-white">{weather.current.temperature_c.toFixed(1)}°C</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Humidity</div>
                  <div className="mt-1 text-lg font-semibold text-white">{weather.current.relative_humidity}% RH</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                Feels like <span className="font-semibold text-white">{Number(thermal?.heat_index?.value || weather.current.temperature_c + 4).toFixed(1)}°C</span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Peak risk</div>
                  <div className="mt-1 text-sm font-medium text-orange-300">{peak_risk_period.window}</div>
                </div>
                <button
                  onClick={() => onNavigateTab('forecast')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white"
                >
                  View details
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">5-day outlook</div>
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
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `Day ${idx + 1}`}
                </div>
                <div className="mt-2 text-xl font-semibold text-white">{day.temp_max}°</div>
                <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{day.risk_category}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Why this risk?</div>
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

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">What to do now</div>
            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
              <button
                onClick={() => setAudience('public')}
                aria-pressed={audience === 'public'}
                className={`rounded-md px-2 py-1 ${audience === 'public' ? 'bg-slate-800 text-white' : ''}`}
              >
                Public
              </button>
              <button
                onClick={() => setAudience('municipal')}
                aria-pressed={audience === 'municipal'}
                className={`rounded-md px-2 py-1 ${audience === 'municipal' ? 'bg-slate-800 text-white' : ''}`}
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

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Population vulnerability</div>
          <div className="mt-5 flex items-end gap-2">
            <div className="text-4xl font-semibold tracking-[-0.08em] text-white">{vulnerability?.score ?? 0}</div>
            <div className="pb-1 text-sm text-slate-400">/ 100</div>
          </div>
          <div className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${severityClasses[vulnerability?.category || ''] || severityClasses.High}`}>
            {vulnerability?.category || 'Baseline'}
          </div>
          <button
            onClick={() => onNavigateTab('vulnerability')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View vulnerability
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {currentAlert && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">Heat alert</div>
              <div className="mt-1 text-lg font-semibold text-white">{currentAlert.title}</div>
            </div>
            <button
              onClick={onOpenAlertModal}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/20"
            >
              View alert
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
