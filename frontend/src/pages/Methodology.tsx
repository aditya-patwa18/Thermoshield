import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  HelpCircle, 
  Cpu, 
  Info, 
  Flame, 
  Thermometer, 
  Droplets,
  Layers
} from 'lucide-react';

export const Methodology: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-orange-400" />
          Scientific Methodology & Engineering Architecture
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Rigorous biometeorological derivations, physiological heat stress formulations, and ML-ready design
        </p>
      </div>

      {/* Mandatory Disclaimer (Section 22 & 50) */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-300 text-sm mb-1">
            Prototype Integrity & Ethical Clarity
          </h4>
          <p>
            ThermalShield implements a <strong>transparent deterministic rule-based prototype engine</strong>. 
            Scores are simulation indicators generated from meteorological variables and predefined vulnerability indices. 
            They are designed for operational prioritization and climate-health emergency planning, and are 
            <strong> not clinically validated mortality or epidemiological morbidity predictions</strong>.
          </p>
        </div>
      </div>

      {/* 1. Meteorological Pipeline & Caching Architecture */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-400" />
          1. Meteorological Ingestion & Cache Fallback Hierarchy
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The system abstracts weather ingestion behind an extensible <code className="text-orange-300">WeatherProvider</code> interface. 
          By default, live data is queried globally from Open-Meteo's meteorological models without paid token requirements.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-emerald-400 font-bold">Data Retrieval Pipeline:</div>
          <div>1. Check in-memory TTL cache (1,800s / 30 min expiration)</div>
          <div>2. If cache miss, invoke Open-Meteo REST API (dry-bulb, RH, wind speed, solar irradiance, dew point)</div>
          <div>3. If live API temporarily unreachable, serve last valid cache</div>
          <div>4. If no cache present, gracefully fallback to <span className="text-amber-400">backend/data/fallback_weather.json</span></div>
        </div>
      </section>

      {/* 2. Biometeorological Equations */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          2. Thermal Stress Formulations
        </h3>

        {/* Heat Index */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-sm font-bold text-slate-200">Heat Index (NOAA Rothfusz Regression)</h4>
          <p className="text-xs text-slate-400 mt-1">
            Calculates apparent perceived temperature under ambient humidity:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-orange-300 mt-2 overflow-x-auto">
            HI = -42.379 + 2.049·T + 10.143·RH - 0.224·T·RH - 0.0068·T² - 0.054·RH² + 0.0012·T²·RH + ...
          </div>
        </div>

        {/* Wet Bulb */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-sm font-bold text-slate-200">Wet-Bulb Temperature (Stull 2011 Formula)</h4>
          <p className="text-xs text-slate-400 mt-1">
            Psychrometric lowest temperature achievable by water evaporative cooling:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 mt-2 overflow-x-auto">
            Tw = T·atan(0.151977·(RH + 8.313659)¹/²) + atan(T + RH) - atan(RH - 1.676331) + 0.003918·RH³/²·atan(0.0231·RH) - 4.686035
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            <strong>Physiological Meaning</strong>: Normal skin temperature is ~35°C. At Tw ≥ 30°C, physical labor causes dangerous cardiovascular heat retention. At Tw ≥ 35°C, evaporative cooling ceases entirely, resulting in fatal hyperthermia even in shaded rest.
          </p>
        </div>

        {/* WBGT */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-sm font-bold text-slate-200">Wet-Bulb Globe Temperature (ISO 7243)</h4>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 mt-2">
            WBGT = 0.7·Tw + 0.2·Tg + 0.1·Ta
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Where black globe temperature Tg is approximated using Liljegren's radiant-wind model based on solar irradiance S (W/m²) and pedestrian wind velocity v (m/s).
          </p>
        </div>

        {/* UTCI */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-sm font-bold text-slate-200">Universal Thermal Climate Index (UTCI)</h4>
          <p className="text-xs text-slate-400 mt-1">
            Operational biometeorological equivalent temperature incorporating the 134-node Fiala human thermoregulation model (Bröde et al. 2012).
          </p>
        </div>

        {/* HTSI */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-sm font-bold text-slate-200">Human Thermal Stress Index (HTSI - 0 to 100)</h4>
          <p className="text-xs text-slate-400 mt-1">
            Custom composite index synthesizing temperature (15%), humidity (15%), direct radiation (10%), wind stagnation (10%), WBGT (25%), and UTCI (25%). Dynamic drivers explain the exact meteorological causes of high readings.
          </p>
        </div>

      </section>

      {/* 3. Future ML Plug-in Architecture (Section 23 & 79) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          3. Extensible Machine Learning (ML) Plug-in Architecture
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          The platform follows an abstract provider design pattern. The backend defines an abstract 
          <code className="text-purple-300"> BaseRiskModel</code> interface in <code className="text-purple-300">backend/app/models/base_model.py</code>.
        </p>

        {/* ASCII Architecture Diagram */}
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
{`+-------------------------------------------------------------+
|                       LIVE WEATHER                          |
|             (Open-Meteo / Fallback Cache)                   |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   THERMAL STRESS ENGINE                     |
|           Heat Index | Wet Bulb | WBGT | UTCI | HTSI        |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               POPULATION VULNERABILITY (PVI)                |
|      Demographics | Outdoor Labor | Cooling Infrastructure   |
+-------------------------------------------------------------+
                               |
                               v
               +-------------------------------+
               |    BaseRiskModel Interface    |
               +-------------------------------+
                               |
         +---------------------+---------------------+
         |                                           |
         v                                           v
+-------------------------------+   +-------------------------------+
|     RuleBasedRiskModel        |   |       MLHealthRiskModel       |
|          [ACTIVE]             |   |        [FUTURE PLUG-IN]       |
| Deterministic Biophysical     |   | Trained Gradient Boosting /   |
| Rule-Based Prototype Engine   |   | XGBoost on Epidemiological    |
| (No ML dataset required)      |   | Excess Mortality & ER Records |
+-------------------------------+   +-------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 SYNTHESIZED DASHBOARD API                   |
|                  GET /api/dashboard/...                     |
+-------------------------------------------------------------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+-----------------------+                 +-----------------------+
|  REACT COMMAND CENTER |                 |   ALERT DISPATCHER    |
|   GIS Map & Charts    |                 | SMS / WhatsApp / Email|
+-----------------------+                 +-----------------------+`}
        </pre>

        <p className="text-xs text-slate-400 leading-relaxed">
          When an epidemiological hospital admissions dataset is trained in the future, a new class 
          <code className="text-purple-300"> MLHealthRiskModel(BaseRiskModel)</code> can load 
          <code className="text-purple-300"> trained_model.pkl</code> or <code className="text-purple-300">joblib</code> 
          and be hot-swapped without modifying frontend routes, REST schemas, or alert services.
        </p>
      </section>

    </div>
  );
};
