import React from 'react';
import { Shield, AlertTriangle, CloudRain, FileText, Activity, Layers, UserCheck } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onOpenSimulation: () => void;
  onOpenAuditLogs: () => void;
  isSimulationActive: boolean;
  injectedRainfall: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  onOpenSimulation,
  onOpenAuditLogs,
  isSimulationActive,
  injectedRainfall,
}) => {
  return (
    <header className="bg-command-900 border-b border-command-700/70 sticky top-0 z-40 px-4 lg:px-6 py-2.5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Authority */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider text-white">AASHRAYA-GIS</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800 rounded">
                NDRF Command
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multi-Hazard Red-Zone & Carrying-Capacity Decision Support System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-command-950/80 p-1 rounded-lg border border-command-800 text-xs font-medium">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'map', label: 'GIS Decision Map', icon: Layers },
            { id: 'relocation', label: 'Relocation Planner', icon: Shield },
            { id: 'analytics', label: 'Spatial Analytics', icon: Activity },
            { id: 'methodology', label: 'Methodology & Data', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                  active
                    ? 'bg-command-700 text-white font-semibold shadow-inner border border-command-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-command-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls: Simulation, Audit Logs, Role Selector */}
        <div className="flex items-center space-x-2.5">
          {/* Rainfall Simulation Trigger Button */}
          <button
            onClick={onOpenSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              isSimulationActive
                ? 'bg-purple-950/80 text-purple-300 border-purple-600 animate-pulse shadow-lg shadow-purple-950/50'
                : 'bg-command-850 hover:bg-command-800 text-cyan-300 border-cyan-800/50'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isSimulationActive ? `Sim Active (+${injectedRainfall}mm)` : 'Simulate Heavy Rain'}
            </span>
          </button>

          {/* Audit Log Button */}
          <button
            onClick={onOpenAuditLogs}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-command-850 hover:bg-command-800 text-slate-300 border border-command-700"
            title="View Decision Audit Trail"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Audit Log</span>
          </button>

          {/* User Role Switcher */}
          <div className="flex items-center space-x-1.5 bg-command-950 px-2.5 py-1 rounded-md border border-command-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="District DMA" className="bg-command-900 text-slate-100">
                District DMA (Wayanad)
              </option>
              <option value="State DMA" className="bg-command-900 text-slate-100">
                State DMA (Kerala)
              </option>
              <option value="GIS Analyst" className="bg-command-900 text-slate-100">
                GIS / Scientific Analyst
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
