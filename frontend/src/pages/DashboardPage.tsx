import React from 'react';
import { DashboardOverview, Habitation, UserRole } from '../types';
import {
  AlertTriangle,
  Users,
  Shield,
  Home,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Download,
} from 'lucide-react';

interface DashboardPageProps {
  overview: DashboardOverview | null;
  habitations: Habitation[];
  userRole: UserRole;
  onSelectHabitation: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSimulation: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  overview,
  habitations,
  userRole,
  onSelectHabitation,
  onNavigateTab,
  onOpenSimulation,
}) => {
  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3" />
        Synchronizing Command Center telemetry...
      </div>
    );
  }

  const queueHabs = userRole === 'GIS Analyst'
    ? habitations.filter((h) => h.risk?.risk_band === 'RED' || h.risk?.risk_band === 'ORANGE')
    : userRole === 'State DMA'
      ? habitations.filter((h) => ['IMMEDIATE', 'SHORT_TERM'].includes(h.priority?.priority_tier || ''))
      : habitations.filter((h) => h.priority?.priority_tier === 'IMMEDIATE');

  const queueScope = userRole === 'GIS Analyst'
    ? 'Red and Orange zone evidence review'
    : userRole === 'State DMA'
      ? 'Immediate and short-term district allocation queue'
      : 'Immediate action queue for district operations';

  const exportQueue = () => {
    const headers = ['Habitation', 'Panchayat', 'Population', 'Risk Score', 'Priority Tier', 'Dominant Hazard'];
    const rows = queueHabs.map((h) => [
      h.name,
      h.panchayat,
      h.population,
      h.risk?.composite_risk ?? 0,
      h.priority?.priority_tier ?? 'MONITOR',
      h.hazards?.landslide_score && h.hazards.landslide_score > 0.7 ? 'Landslide' : 'Flood',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aashraya-${userRole.toLowerCase().replaceAll(' ', '-')}-priority-queue.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    {
      label: 'Habitations Assessed',
      value: overview.total_habitations_assessed,
      sub: 'Wayanad District Scope',
      icon: Home,
      color: 'text-blue-400',
      bg: 'bg-blue-950/40 border-blue-800/60',
    },
    {
      label: 'Critical Red Zones',
      value: overview.red_zone_habitations_count,
      sub: 'Risk Score ≥ 70 / Override',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-950/50 border-red-800/80',
    },
    {
      label: 'Immediate Relocation',
      value: overview.critical_immediate_count,
      sub: 'Action Required This Monsoon',
      icon: Shield,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/70',
    },
    {
      label: 'Population Exposed',
      value: overview.total_population_exposed.toLocaleString(),
      sub: 'In Red & Orange Zones',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/60',
    },
    {
      label: 'Population Requiring Relocation',
      value: overview.population_requiring_relocation.toLocaleString(),
      sub: 'Immediate + Short-Term Queue',
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-950/40 border-orange-800/60',
    },
    {
      label: 'Safe Relocation Capacity',
      value: overview.total_safe_capacity_available.toLocaleString(),
      sub: 'Effective with 15% Buffer',
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/60',
    },
    {
      label: 'Candidate Safe Sites',
      value: overview.candidate_sites_count,
      sub: 'Hazard-Excluded Verified',
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-800/60',
    },
    {
      label: 'Active Critical Alerts',
      value: overview.active_alerts.length,
      sub: 'Live Emergency Feed',
      icon: Activity,
      color: 'text-red-300',
      bg: 'bg-red-950/40 border-red-800/60',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${kpi.bg} shadow-lg relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <span className={`text-2xl lg:text-3xl font-black ${kpi.color}`}>
                  {kpi.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Priority Action Queue & Alert Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Habitations Queue */}
        <div className="lg:col-span-2 bg-command-900 border border-command-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {userRole === 'GIS Analyst' ? 'Hazard Evidence Review Queue' : 'High-Priority Habitation Relocation Queue'}
                </h2>
                <p className="text-xs text-slate-400">
                  {queueScope} · Prioritized by Risk × Vulnerability × Urgency Multipliers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportQueue}
                title="Export visible priority queue as CSV"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-command-800 hover:bg-command-700 text-cyan-300 rounded-lg border border-command-600 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => onNavigateTab('relocation')}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-command-800 hover:bg-command-700 text-white rounded-lg border border-command-600 transition-all"
              >
                <span>Open Relocation Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-command-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Habitation</th>
                  <th className="py-2.5 px-3">Panchayat</th>
                  <th className="py-2.5 px-3">Population</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Priority Tier</th>
                  <th className="py-2.5 px-3">Dominant Hazard</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-command-800/60">
                {queueHabs.slice(0, 8).map((h) => {
                  const riskScore = h.risk?.composite_risk || 0;
                  const tier = h.priority?.priority_tier || 'MONITOR';

                  return (
                    <tr
                      key={h.id}
                      onClick={() => onSelectHabitation(h.id)}
                      className="hover:bg-command-850/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>{h.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{h.panchayat}</td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        {h.population.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-red-400 font-mono">
                          {riskScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-red-300 border border-red-800">
                          {tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        {h.hazards?.landslide_score && h.hazards.landslide_score > 0.7
                          ? `Landslide (${Math.round(h.hazards.landslide_score * 100)}%)`
                          : `Flood (${Math.round((h.hazards?.flood_score || 0) * 100)}%)`}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="px-2 py-1 bg-command-800 hover:bg-command-700 text-white rounded text-[11px] font-medium">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Active Alerts & Simulation Trigger */}
        <div className="space-y-6">
          {/* Quick Simulation Trigger Card */}
          <div className="bg-gradient-to-br from-command-900 to-purple-950/50 border border-purple-800/60 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-900/60 flex items-center justify-center text-purple-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dynamic Event Simulator</h3>
                <p className="text-[11px] text-slate-400">Recompute decisions on weather influx</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Inject a simulated monsoon surge to observe live pipeline re-calculation of
              hazard scores, risk tiers, and relocation recommendations without reloading.
            </p>

            <button
              onClick={onOpenSimulation}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center space-x-2"
            >
              <span>Launch Rainfall Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Command Alerts Ticker */}
          <div className="bg-command-900 border border-command-700/80 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-command-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Active Operational Alerts</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {overview.active_alerts.length} Broadcasts
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {overview.active_alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => alert.habitation_id && alert.habitation_id !== 'DISTRICT_WIDE' && onSelectHabitation(alert.habitation_id)}
                  className="p-3 bg-command-950 rounded-xl border border-command-800 hover:border-command-700 cursor-pointer text-xs space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {alert.timestamp.split(' ')[1] || alert.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium leading-tight">{alert.message}</p>
                  <p className="text-[10px] text-amber-400/90 italic">
                    Action: {alert.action_required}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
