import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Flame,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { api } from '../../services/api';
import { CurrentWeather, ThermalIntelligence, LocationInfo } from '../../types';

interface ScenarioSimulatorProps {
  weather: CurrentWeather;
  thermal: ThermalIntelligence;
  location: LocationInfo;
  pviScore?: number;
  currentRiskScore?: number;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  weather,
  thermal,
  location,
  pviScore = 55,
  currentRiskScore = 75
}) => {
  // Environmental Microclimate Controls
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [humidityDelta, setHumidityDelta] = useState<number>(10.0);
  const [windDelta, setWindDelta] = useState<number>(-0.5);
  const [radiationPreset, setRadiationPreset] = useState<number>(750);

  const [simResults, setSimResults] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Administrative Intervention Levers
  const [coolingActive, setCoolingActive] = useState<boolean>(true);
  const [capacityExpansion, setCapacityExpansion] = useState<number>(30);
  const [workShifted, setWorkShifted] = useState<boolean>(true);
  const [alertIssued, setAlertIssued] = useState<boolean>(true);
  const [waterPoints, setWaterPoints] = useState<number>(12);

  const [interventionResults, setInterventionResults] = useState<any>(null);

  // Run environmental simulation when inputs change
  useEffect(() => {
    let cancelled = false;
    const runSim = async () => {
      try {
        const res = await api.simulateScenario({
          base_temperature_c: weather.temperature_c,
          base_humidity: weather.relative_humidity,
          base_wind_speed_ms: weather.wind_speed_ms,
          base_solar_radiation_wm2: weather.solar_radiation_wm2,
          temp_delta_c: tempDelta,
          humidity_delta_pct: humidityDelta,
          wind_delta_ms: windDelta,
          solar_radiation_override_wm2: radiationPreset,
          pvi_score: pviScore
        });
        if (cancelled) return;
        setSimResults(res);
        setSimError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('Scenario simulation failed:', e);
        setSimError('Could not run the simulation. Check that the backend is reachable and try again.');
      }
    };
    runSim();
    return () => {
      cancelled = true;
    };
  }, [tempDelta, humidityDelta, windDelta, radiationPreset, weather, pviScore]);

  // Run administrative action simulation when levers change
  useEffect(() => {
    let cancelled = false;
    const runIntervention = async () => {
      try {
        const res = await api.simulateInterventions({
          base_pvi_score: pviScore,
          current_risk_score: currentRiskScore,
          cooling_centers_active: coolingActive,
          capacity_expansion_percent: capacityExpansion,
          outdoor_work_shifted: workShifted,
          public_alert_issued: alertIssued,
          water_points_deployed: waterPoints
        });
        if (cancelled) return;
        setInterventionResults(res);
        setSimError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('Intervention simulation failed:', e);
        setSimError('Could not run the simulation. Check that the backend is reachable and try again.');
      }
    };
    runIntervention();
    return () => {
      cancelled = true;
    };
  }, [coolingActive, capacityExpansion, workShifted, alertIssued, waterPoints, pviScore, currentRiskScore]);

  const resetDeltas = () => {
    setTempDelta(0);
    setHumidityDelta(0);
    setWindDelta(0);
    setRadiationPreset(weather.solar_radiation_wm2);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Environmental 'What-If' Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Microclimate Stress Simulator ("What-If?" Scenario)
            </h3>
            <p className="text-xs text-slate-400">
              Simulate climate anomalies and evaluate instantaneous shifts in HTSI and population health risk
            </p>
          </div>
          <button
            onClick={resetDeltas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Current</span>
          </button>
        </div>

        {simError && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            {simError}
          </div>
        )}

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Temperature Delta */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Temp Anomaly</span>
              <span className="font-mono text-orange-400">
                {tempDelta >= 0 ? `+${tempDelta}°C` : `${tempDelta}°C`}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="6"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>-3°C</span>
              <span>Baseline: {weather.temperature_c}°C</span>
              <span>+6°C</span>
            </div>
          </div>

          {/* Humidity Delta */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Humidity Surge</span>
              <span className="font-mono text-blue-400">
                {humidityDelta >= 0 ? `+${humidityDelta}%` : `${humidityDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="25"
              step="1"
              value={humidityDelta}
              onChange={(e) => setHumidityDelta(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>-15%</span>
              <span>Baseline: {weather.relative_humidity}%</span>
              <span>+25%</span>
            </div>
          </div>

          {/* Wind Delta */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Wind Stagnation</span>
              <span className="font-mono text-cyan-400">
                {windDelta >= 0 ? `+${windDelta} m/s` : `${windDelta} m/s`}
              </span>
            </div>
            <input
              type="range"
              min="-1.5"
              max="3"
              step="0.2"
              value={windDelta}
              onChange={(e) => setWindDelta(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>-1.5 (Stagnant)</span>
              <span>Current: {weather.wind_speed_ms}</span>
              <span>+3.0 m/s</span>
            </div>
          </div>

          {/* Solar Flux Presets */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Solar Irradiance</span>
              <span className="font-mono text-amber-400">{radiationPreset} W/m²</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setRadiationPreset(350)}
                className={`py-1 text-[10px] font-bold rounded ${radiationPreset === 350 ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Low (350)
              </button>
              <button
                type="button"
                onClick={() => setRadiationPreset(650)}
                className={`py-1 text-[10px] font-bold rounded ${radiationPreset === 650 ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Med (650)
              </button>
              <button
                type="button"
                onClick={() => setRadiationPreset(900)}
                className={`py-1 text-[10px] font-bold rounded ${radiationPreset === 900 ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Intense (900)
              </button>
            </div>
            <div className="text-[10px] text-slate-500 text-center">Peak solar radiation scenario</div>
          </div>

        </div>

        {/* Current vs Scenario Comparison Panel */}
        {simResults && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Comparative Impact Analysis (Current vs Simulated)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* HTSI Comparison */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">HTSI Index</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">{simResults.baseline.htsi}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-white">{simResults.scenario.htsi}</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${simResults.deltas.htsi_change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {simResults.deltas.htsi_change >= 0 ? `+${simResults.deltas.htsi_change}` : simResults.deltas.htsi_change} pts
                </div>
              </div>

              {/* WBGT Comparison */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Outdoor WBGT</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">{simResults.baseline.wbgt}°</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-white">{simResults.scenario.wbgt}°C</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${simResults.deltas.wbgt_change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {simResults.deltas.wbgt_change >= 0 ? `+${simResults.deltas.wbgt_change}` : simResults.deltas.wbgt_change}°C
                </div>
              </div>

              {/* UTCI Comparison */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">UTCI Equivalent</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">{simResults.baseline.utci}°</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-white">{simResults.scenario.utci}°C</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${simResults.deltas.utci_change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {simResults.deltas.utci_change >= 0 ? `+${simResults.deltas.utci_change}` : simResults.deltas.utci_change}°C
                </div>
              </div>

              {/* Health Risk Score */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Prototype Risk</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">{simResults.baseline.health_risk}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-2xl font-black text-orange-400">{simResults.scenario.health_risk}</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${simResults.deltas.health_risk_change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {simResults.deltas.health_risk_change >= 0 ? `+${simResults.deltas.health_risk_change}` : simResults.deltas.health_risk_change} pts
                </div>
              </div>

            </div>

            <div className="mt-3 text-[11px] text-slate-400">
              <strong>Simulated Drivers Shift</strong>: {simResults.drivers_shift?.join(' • ')}
            </div>
          </div>
        )}
      </div>

      {/* 2. Heat Action Plan (HAP) Administrative Intervention Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Heat Action Plan (HAP) Intervention Simulation
          </h3>
          <p className="text-xs text-slate-400">
            Simulate administrative and public health relief measures to model exposure mitigation
          </p>
        </div>

        {/* Civic Levers Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <button
            onClick={() => setCoolingActive(!coolingActive)}
            aria-pressed={coolingActive}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
              coolingActive ? 'bg-emerald-950/40 border-emerald-500/40 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            {coolingActive ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
            <div>
              <div className="text-xs font-bold">Open Public Cooling Centers</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Activate designated air-conditioned municipal shelters</div>
            </div>
          </button>

          <button
            onClick={() => setWorkShifted(!workShifted)}
            aria-pressed={workShifted}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
              workShifted ? 'bg-emerald-950/40 border-emerald-500/40 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            {workShifted ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
            <div>
              <div className="text-xs font-bold">Shift Outdoor Work Hours</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Mandate work stoppage during peak heat (11:30 AM – 4:00 PM)</div>
            </div>
          </button>

          <button
            onClick={() => setAlertIssued(!alertIssued)}
            aria-pressed={alertIssued}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
              alertIssued ? 'bg-emerald-950/40 border-emerald-500/40 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            {alertIssued ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
            <div>
              <div className="text-xs font-bold">Issue Mass Civic Warning</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Geo-targeted SMS and loudspeaker broadcasts</div>
            </div>
          </button>

        </div>

        {/* Capacity & Water Point Levers */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex justify-between text-xs font-semibold">
              <label htmlFor="capacity-expansion" className="text-slate-300">Shelter Capacity Expansion</label>
              <span className="font-mono text-emerald-400">+{capacityExpansion}%</span>
            </div>
            <input
              id="capacity-expansion"
              type="range"
              min={0}
              max={100}
              step={5}
              value={capacityExpansion}
              onChange={(e) => setCapacityExpansion(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500"><span>0%</span><span>+100%</span></div>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex justify-between text-xs font-semibold">
              <label htmlFor="water-points" className="text-slate-300">Mobile Water Points Deployed</label>
              <span className="font-mono text-sky-400">{waterPoints}</span>
            </div>
            <input
              id="water-points"
              type="range"
              min={0}
              max={50}
              step={1}
              value={waterPoints}
              onChange={(e) => setWaterPoints(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500"><span>0</span><span>50</span></div>
          </div>
        </div>

        {/* Intervention Effects Summary */}
        {interventionResults && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Operational Mitigation Scenario Results
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Exposure Score Reduced by -{interventionResults.results.risk_mitigation} pts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-xs text-slate-400">Active Operational Improvements:</div>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {interventionResults.results.coverage_improvements?.map((imp: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                  {interventionResults.results.coverage_improvements?.length === 0 && (
                    <li className="text-slate-500">No active interventions selected.</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  Simulated Operational Risk
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {interventionResults.results.simulated_operational_risk}
                  <span className="text-sm font-semibold text-slate-400 ml-1">/ 100</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Baseline: {interventionResults.results.baseline_risk} / 100
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
              <strong>Caveat</strong>: {interventionResults.disclaimer}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
