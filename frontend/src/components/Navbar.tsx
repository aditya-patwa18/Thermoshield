import React, { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Users,
  Building2,
  BellRing,
  Sparkles,
  BarChart3,
  Terminal,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'risk-map'
  | 'forecast'
  | 'vulnerability'
  | 'infrastructure'
  | 'alerts'
  | 'scenario'
  | 'analytics'
  | 'api'
  | 'methodology';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, activeAlertCount = 0 }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'risk-map' as NavTab, label: 'Map', icon: Map },
    { id: 'forecast' as NavTab, label: 'Forecast', icon: TrendingUp },
    { id: 'vulnerability' as NavTab, label: 'Vulnerability', icon: Users },
    { id: 'infrastructure' as NavTab, label: 'Infrastructure', icon: Building2 },
    { id: 'alerts' as NavTab, label: 'Alerts', icon: BellRing, badge: activeAlertCount },
  ];

  const moreTabs = [
    { id: 'scenario' as NavTab, label: 'Scenario', icon: Sparkles },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'api' as NavTab, label: 'API', icon: Terminal },
    { id: 'methodology' as NavTab, label: 'Methodology', icon: BookOpen },
  ];

  return (
    <nav className="sticky top-[73px] z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto px-4 py-2 lg:px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="relative ml-auto">
          <button
            onClick={() => setMoreOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <span>More</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>

          {moreOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[180px] rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMoreOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
