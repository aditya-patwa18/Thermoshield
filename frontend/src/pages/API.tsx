import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Play, 
  Radio, 
  Server,
  Code2
} from 'lucide-react';
import { SystemStatus } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

interface APIPageProps {
  systemStatus: SystemStatus | null;
}

export const API: React.FC<APIPageProps> = ({ systemStatus }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/dashboard/location/mumbai');
  const [responseJson, setResponseJson] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const endpoints = [
    { label: 'GET /api/dashboard/location/mumbai', path: '/dashboard/location/mumbai' },
    { label: 'GET /api/health', path: '/health' },
    { label: 'GET /api/locations', path: '/locations' },
    { label: 'GET /api/thermal?temperature=38&humidity=65', path: '/thermal?temperature=38&humidity=65' },
    { label: 'GET /api/alerts', path: '/alerts' },
    { label: 'GET /api/infrastructure/nearest?lat=19.076&lon=72.877', path: '/infrastructure/nearest?lat=19.076&lon=72.877' }
  ];

  const executeCall = async (path: string) => {
    setLoading(true);
    setStatusCode(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api${path}`);
      setStatusCode(res.status);
      setResponseJson(JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      setStatusCode(e?.response?.status || 500);
      setResponseJson(JSON.stringify(e?.response?.data || { error: e.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeCall(selectedEndpoint);
  }, [selectedEndpoint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-orange-400" />
            ThermalShield REST API & Live System Introspection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive developer console, automated OpenAPI/Swagger documentation, and live status verification
          </p>
        </div>

        <a
          href={`${API_BASE_URL}/api/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-950/50 transition-all self-start sm:self-auto"
        >
          <Code2 className="w-4 h-4" />
          <span>Interactive Swagger /docs</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>

      {/* Actual Live System Status Grid (Section 48 & 83) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Backend Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FastAPI Core</div>
            <div className="text-sm font-bold text-white mt-0.5">Operational</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">v{systemStatus?.version || '1.0.0'} • Port 8000</div>
          </div>
        </div>

        {/* Weather Provider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meteorology Provider</div>
            <div className="text-sm font-bold text-white mt-0.5">{systemStatus?.weather_provider?.name || 'Open-Meteo'}</div>
            <div className="text-[10px] text-blue-400 font-mono mt-1">Live Global REST Feed</div>
          </div>
        </div>

        {/* Maps Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className={`p-2 rounded-xl border ${
            systemStatus?.maps_configured 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maps Engine</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {systemStatus?.maps_configured ? 'Google Maps Platform' : 'Leaflet + CartoDB'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {systemStatus?.maps_configured ? 'API Key Active' : 'Zero-Key Fallback'}
            </div>
          </div>
        </div>

        {/* Multi-Channel Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className={`p-2 rounded-xl border ${
            systemStatus?.notifications?.sms?.configured
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notifications</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {systemStatus?.notifications?.sms?.configured ? 'Twilio & SMTP Active' : 'Demo Preview Mode'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              {systemStatus?.notifications?.sms?.configured ? 'Credentials Ready' : 'Unconfigured'}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Endpoint Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        
        {/* Endpoint Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Select REST Endpoint to Test
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {endpoints.map((ep) => (
                <option key={ep.path} value={ep.path}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => executeCall(selectedEndpoint)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loading ? 'Executing...' : 'Execute Request'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Response Viewer */}
        <div>
          <div className="flex items-center justify-between py-2 text-xs text-slate-400 font-mono">
            <span>Response Payload (JSON)</span>
            {statusCode && (
              <span className={`px-2 py-0.5 rounded font-bold ${
                statusCode === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                HTTP {statusCode} OK
              </span>
            )}
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto max-h-[500px] leading-relaxed">
            {loading ? 'Executing request...' : responseJson}
          </pre>
        </div>

      </div>

    </div>
  );
};
