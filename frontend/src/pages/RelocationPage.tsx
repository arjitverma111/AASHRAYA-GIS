import React, { useState } from 'react';
import { Habitation, CandidateSite, OptimizationResponse } from '../types';
import { api } from '../services/api';
import { CapacityBottleneckCard } from '../components/CapacityBottleneckCard';
import { RoleConfig } from '../context/RoleContext';
import {
  Shield,
  ArrowRight,
  Cpu,
  CheckCircle,
  AlertOctagon,
  MapPin,
  Users,
  Settings,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface RelocationPageProps {
  habitations: Habitation[];
  candidateSites: CandidateSite[];
  onSelectHabitation: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  lastOptimization: OptimizationResponse | null;
  setLastOptimization: (res: OptimizationResponse) => void;
  roleConfig: RoleConfig;
}

export const RelocationPage: React.FC<RelocationPageProps> = ({
  habitations,
  candidateSites,
  onSelectHabitation,
  onNavigateTab,
  lastOptimization,
  setLastOptimization,
  roleConfig,
}) => {
  const [tierFilter, setTierFilter] = useState<'IMMEDIATE' | 'ALL_PRIORITY'>('IMMEDIATE');
  const [safetyMargin, setSafetyMargin] = useState<number>(0.85);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [selectedVillageIds, setSelectedVillageIds] = useState<string[]>([]);

  // Eligible habitations based on filter
  const eligibleHabitations = habitations.filter((h) => {
    const tier = h.priority?.priority_tier;
    if (tierFilter === 'IMMEDIATE') return tier === 'IMMEDIATE';
    return tier === 'IMMEDIATE' || tier === 'SHORT_TERM';
  });

  const handleToggleVillage = (id: string) => {
    if (selectedVillageIds.includes(id)) {
      setSelectedVillageIds(selectedVillageIds.filter((v) => v !== id));
    } else {
      setSelectedVillageIds([...selectedVillageIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedVillageIds.length === eligibleHabitations.length) {
      setSelectedVillageIds([]);
    } else {
      setSelectedVillageIds(eligibleHabitations.map((h) => h.id));
    }
  };

  const handleRunOptimization = async () => {
    setIsSolving(true);
    try {
      const payload = {
        habitation_ids: selectedVillageIds.length > 0 ? selectedVillageIds : undefined,
        tier_filter: selectedVillageIds.length === 0 ? tierFilter : undefined,
        safety_margin: safetyMargin,
      };

      const res = await api.optimizeRelocation(payload);
      setLastOptimization(res);
      setIsSolving(false);
    } catch (err) {
      console.error(err);
      setIsSolving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-command-800 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">
                {roleConfig.label} Relocation Planner
              </h1>
              <p className="text-xs text-slate-400">
                {roleConfig.scopeLabel} · MILP Solver under Multi-Dimensional Bottlenecks
              </p>
            </div>
          </div>
        </div>

        {/* Solver Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Safety margin selector */}
          <div className="flex items-center space-x-2 bg-command-900 border border-command-700 px-3 py-1.5 rounded-lg text-xs">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Safety Buffer:</span>
            <select
              value={safetyMargin}
              onChange={(e) => setSafetyMargin(Number(e.target.value))}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={0.85} className="bg-command-900">15% Margin (0.85 Norm)</option>
              <option value={0.90} className="bg-command-900">10% Margin (0.90 Light)</option>
              <option value={0.75} className="bg-command-900">25% Margin (0.75 Strict)</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center bg-command-900 border border-command-700 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTierFilter('IMMEDIATE')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                tierFilter === 'IMMEDIATE'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Immediate Tier ({habitations.filter((h) => h.priority?.priority_tier === 'IMMEDIATE').length})
            </button>
            <button
              onClick={() => setTierFilter('ALL_PRIORITY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                tierFilter === 'ALL_PRIORITY'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Priority ({habitations.filter((h) => h.priority?.priority_tier === 'IMMEDIATE' || h.priority?.priority_tier === 'SHORT_TERM').length})
            </button>
          </div>

          {/* Solve Button */}
          <button
            onClick={handleRunOptimization}
            disabled={isSolving}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/60 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>{isSolving ? 'Solving MILP Matrix...' : 'Execute Optimal Allocation'}</span>
          </button>
        </div>
      </div>

      {/* Optimization Results Section (if solved) */}
      {lastOptimization && (
        <div className="bg-command-900 border border-emerald-500/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between border-b border-command-800 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Mathematical Allocation Solution ({lastOptimization.solver_status})
                </h2>
                <p className="text-xs text-slate-400">
                  Computed via PuLP/CBC in <span className="font-mono text-emerald-400 font-bold">{lastOptimization.execution_time_ms} ms</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="bg-command-950 px-3 py-1 rounded-lg border border-command-800">
                Relocated: <strong className="text-emerald-400">{lastOptimization.total_population_relocated.toLocaleString()}</strong> people
              </span>
              <span className="bg-command-950 px-3 py-1 rounded-lg border border-command-800">
                Assigned: <strong className="text-white">{lastOptimization.assigned_count}</strong> villages
              </span>
              {lastOptimization.escalated_count > 0 && (
                <span className="bg-red-950/80 px-3 py-1 rounded-lg border border-red-800 text-red-300 font-bold">
                  Escalated: {lastOptimization.escalated_count} villages
                </span>
              )}
              <button
                onClick={() => onNavigateTab('map')}
                className="flex items-center space-x-1.5 px-3 py-1 bg-command-800 hover:bg-command-750 text-cyan-300 border border-command-700 rounded-lg"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Routes on Map</span>
              </button>
            </div>
          </div>

          {/* Allocation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lastOptimization.assignments.map((assign) => {
              const isEscalated = assign.status === 'ESCALATE_INFEASIBLE';
              return (
                <div
                  key={assign.village_id}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                    isEscalated
                      ? 'bg-red-950/30 border-red-800/80'
                      : 'bg-command-950 border-command-700 hover:border-emerald-500/50 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isEscalated ? 'bg-red-500' : 'bg-emerald-400'}`} />
                      <span className="font-bold text-sm text-white">{assign.village_name}</span>
                      <span className="text-slate-400 font-mono">({assign.population.toLocaleString()} pop)</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isEscalated
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isEscalated ? 'ESCALATE TO STATE' : 'OPTIMAL ASSIGNED'}
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  {!isEscalated ? (
                    <div className="flex items-center justify-between p-2.5 bg-command-900/90 rounded-lg border border-command-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Allocated Destination</span>
                        <strong className="text-emerald-400 text-xs">{assign.site_name}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Route Distance</span>
                        <span className="font-mono text-white font-bold">{assign.distance_km?.toFixed(1)} km</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Headroom Left</span>
                        <span className="font-mono text-cyan-400 font-bold">{assign.remaining_site_capacity?.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-red-950/60 rounded-lg border border-red-800/80 text-red-300">
                      <div className="flex items-center space-x-1.5 font-bold mb-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                        <span>Capacity Exhaustion Escalation Triggered</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{assign.reason}</p>
                    </div>
                  )}

                  <p className="text-slate-400 text-[11px] italic">
                    {assign.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Workspace: Habitations Queue vs Candidate Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Habitations Queue */}
        <div className="lg:col-span-5 bg-command-900 border border-command-700/80 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-command-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Vulnerable Habitations Queue ({eligibleHabitations.length})
              </h2>
            </div>
            <button
              onClick={handleSelectAll}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {selectedVillageIds.length === eligibleHabitations.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {eligibleHabitations.map((h) => {
              const isChecked = selectedVillageIds.includes(h.id);
              const tier = h.priority?.priority_tier || 'MONITOR';

              return (
                <div
                  key={h.id}
                  onClick={() => handleToggleVillage(h.id)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start space-x-3 ${
                    isChecked
                      ? 'bg-command-800 border-cyan-500 shadow-md'
                      : 'bg-command-950 border-command-800 hover:border-command-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-1 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <strong className="text-white text-xs">{h.name}</strong>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-800">
                        {tier}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {h.panchayat} | Pop: <span className="text-slate-200 font-mono font-bold">{h.population.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] mt-1 flex justify-between">
                      <span>Risk: <strong className="text-red-400">{h.risk?.composite_risk}/100</strong></span>
                      <span>Slope: {h.terrain.slope_deg}°</span>
                      <span>Rain: {h.current_rainfall_24h_mm} mm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Candidate Sites with Carrying Capacities */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between bg-command-900 border border-command-700/80 p-3.5 rounded-xl">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Candidate Relocation Sites & Carrying Capacity Bottlenecks
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {candidateSites.length} Sites Surveyed
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {candidateSites.map((site) => (
              <CapacityBottleneckCard key={site.id} site={site} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
