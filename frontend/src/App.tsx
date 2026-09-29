import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar, NavTab } from './components/Navbar';
import { Overview } from './pages/Overview';
import { RiskMap } from './pages/RiskMap';
import { Forecast } from './pages/Forecast';
import { Vulnerability } from './pages/Vulnerability';
import { Infrastructure } from './pages/Infrastructure';
import { Alerts } from './pages/Alerts';
import { Scenario } from './pages/Scenario';
import { Analytics } from './pages/Analytics';
import { API } from './pages/API';
import { Methodology } from './pages/Methodology';
import { AlertModal } from './components/Alerts/AlertModal';
import { api } from './services/api';
import { DashboardData, SystemStatus, ActiveAlert } from './types';
import { AlertCircle, Flame, ShieldAlert, HeartHandshake } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [monitoredCities, setMonitoredCities] = useState<any[]>([]);
  const [wardsGeoJSON, setWardsGeoJSON] = useState<any | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  
  const [currentCityId, setCurrentCityId] = useState<string>('mumbai');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

  // Initial load of metadata, cities, and status
  useEffect(() => {
    const initAppData = async () => {
      try {
        const [statusRes, citiesRes, wardsRes, alertsRes] = await Promise.allSettled([
          api.getHealth(),
          api.getLocations(),
          api.getMumbaiWardsGeoJSON(),
          api.getActiveAlerts()
        ]);

        if (statusRes.status === 'fulfilled') setSystemStatus(statusRes.value);
        if (citiesRes.status === 'fulfilled') setMonitoredCities(citiesRes.value);
        if (wardsRes.status === 'fulfilled') setWardsGeoJSON(wardsRes.value);
        if (alertsRes.status === 'fulfilled') setActiveAlerts(alertsRes.value);
      } catch (e) {
        console.error('App init error:', e);
      }
    };
    initAppData();
  }, []);

  // Load Dashboard Data when location changes
  useEffect(() => {
    const loadDashboard = async () => {
      setLoadingDashboard(true);
      setErrorMsg(null);
      try {
        let data: DashboardData;
        if (customCoords) {
          data = await api.getDashboardByCoords(customCoords.lat, customCoords.lon, customCoords.name);
        } else {
          data = await api.getDashboardByLocation(currentCityId);
        }
        setDashboardData(data);
      } catch (e: any) {
        console.error('Failed to load dashboard:', e);
        setErrorMsg('Failed to synchronize live weather intelligence. Please ensure backend is running.');
      } finally {
        setLoadingDashboard(false);
      }
    };
    loadDashboard();
  }, [currentCityId, customCoords]);

  const handleSelectCity = (cityId: string) => {
    setCustomCoords(null);
    setCurrentCityId(cityId);
  };

  const handleSelectCoords = (lat: number, lon: number, name?: string) => {
    setCustomCoords({ lat, lon, name });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        currentLocation={dashboardData?.location || null}
        onSelectCity={handleSelectCity}
        onSearchCoordinates={(lat, lon, name) => handleSelectCoords(lat, lon, name)}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
        monitoredCities={monitoredCities}
      />

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeAlertCount={activeAlerts.length}
      />

      {/* Error Alert Banner if any */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full">
          <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3.5 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 pt-6">
        {loadingDashboard && !dashboardData ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Contacting meteorological feeds & thermal biophysical engine...
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <Overview
                dashboardData={dashboardData}
                systemStatus={systemStatus}
                monitoredCities={monitoredCities}
                wardsGeoJSON={wardsGeoJSON}
                onNavigateTab={setActiveTab}
                onSelectCity={handleSelectCity}
                onSelectCoords={handleSelectCoords}
                onOpenAlertModal={() => setIsAlertModalOpen(true)}
              />
            )}

            {activeTab === 'risk-map' && (
              <RiskMap
                dashboardData={dashboardData}
                monitoredCities={monitoredCities}
                wardsGeoJSON={wardsGeoJSON}
                onSelectCity={handleSelectCity}
                onSelectCoords={handleSelectCoords}
              />
            )}

            {activeTab === 'forecast' && (
              <Forecast dashboardData={dashboardData} />
            )}

            {activeTab === 'vulnerability' && (
              <Vulnerability
                dashboardData={dashboardData}
                monitoredCities={monitoredCities}
                onSelectCity={handleSelectCity}
              />
            )}

            {activeTab === 'infrastructure' && (
              <Infrastructure
                dashboardData={dashboardData}
                onLocate={(lat, lon, name) => {
                  handleSelectCoords(lat, lon, name);
                  setActiveTab('risk-map');
                }}
              />
            )}

            {activeTab === 'alerts' && (
              <Alerts
                dashboardData={dashboardData}
                activeAlerts={activeAlerts}
                systemStatus={systemStatus}
                onOpenAlertModal={() => setIsAlertModalOpen(true)}
              />
            )}

            {activeTab === 'scenario' && (
              <Scenario dashboardData={dashboardData} />
            )}

            {activeTab === 'analytics' && (
              <Analytics dashboardData={dashboardData} />
            )}

            {activeTab === 'api' && (
              <API systemStatus={systemStatus} />
            )}

            {activeTab === 'methodology' && (
              <Methodology />
            )}
          </>
        )}
      </main>

      {/* Emergency Alert Modal */}
      {dashboardData && (
        <AlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          systemStatus={systemStatus}
          locationName={dashboardData.location.name}
          severity={dashboardData.health_risk.category}
          temperature={dashboardData.weather.current.temperature_c}
          htsi={dashboardData.thermal.htsi}
          riskScore={dashboardData.health_risk.risk_score}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">THERMALSHIELD</span>
            <span>•</span>
            <span>Human Thermal Stress Intelligence Platform</span>
          </div>
          <div className="text-center sm:text-right">
            <span>Deterministic biometeorological prototype</span>
            <span className="mx-2">•</span>
            <span className="text-orange-400 font-semibold">Not a clinical mortality forecast</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
