import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { DashboardData } from '../types';
import { ScenarioSimulator } from '../components/Scenario/ScenarioSimulator';

interface ScenarioPageProps {
  dashboardData: DashboardData | null;
}

export const Scenario: React.FC<ScenarioPageProps> = ({ dashboardData }) => {
  if (!dashboardData) {
    return <div className="text-center p-8 text-slate-400">Loading simulation workspace...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          Interactive Scenario Simulator & Heat Action Laboratory
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Evaluate physical biometeorological sensitivities and model municipal Heat Action Plan interventions for {dashboardData.location.name}
        </p>
      </div>

      <ScenarioSimulator
        weather={dashboardData.weather.current}
        thermal={dashboardData.thermal}
        location={dashboardData.location}
        pviScore={dashboardData.vulnerability?.score}
        currentRiskScore={dashboardData.health_risk.risk_score}
      />

    </div>
  );
};
