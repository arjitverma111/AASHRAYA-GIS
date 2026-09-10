import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Activity, PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';
import { RoleConfig } from '../context/RoleContext';

interface AnalyticsPageProps {
  roleConfig: RoleConfig;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ roleConfig }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3" />
        Generating spatial analytics from decision models...
      </div>
    );
  }

  const topHabs = data.habitation_risk_ranking?.slice(0, 10) || [];
  const siteCaps = data.site_capacity_bottlenecks || [];
  const hazardPie = data.hazard_composition_share || [];
  const tehsils = data.tehsil_comparative_summary || [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-command-800 pb-3">
        <div className="w-9 h-9 rounded-xl bg-command-800 border border-command-700 flex items-center justify-center text-cyan-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">{roleConfig.label} · Spatial Analytics</h1>
          <p className="text-xs text-slate-400">{roleConfig.datasetScope}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-800/70 bg-cyan-950/20 px-4 py-3 text-xs text-cyan-100">
        <strong>{roleConfig.scopeLabel}:</strong> Charts use the available {roleConfig.datasetScope.toLowerCase()}.
        {roleConfig.level === 'state' && ' State-wide records are not present in this prototype, so the comparison remains Wayanad-backed.'}
        {roleConfig.showAdvancedAnalysis && ' Scientific analyst mode exposes model outputs, hazard composition, and confidence fields.'}
      </div>

      {/* Grid: Risk Distribution & Hazard Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 10 Habitations Risk Scores */}
        <div className="lg:col-span-8 bg-command-900 border border-command-700/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-command-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Top 10 High-Risk Habitations (Risk vs. Population)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Normalized 0-100</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHabs} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [val, name === 'composite_risk' ? 'Composite Risk' : 'Urgency Priority']}
                />
                <Bar dataKey="composite_risk" name="Composite Risk (0-100)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="priority_score" name="Urgency Priority (0-100)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Composition Share Pie */}
        <div className="lg:col-span-4 bg-command-900 border border-command-700/80 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 border-b border-command-800 pb-2.5">
            <PieIcon className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              District Hazard Exposure Share
            </h2>
          </div>

          <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={hazardPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {hazardPie.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Hazard Share']}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center space-x-3 text-[11px] text-slate-300 mt-2">
              {hazardPie.map((item: any) => (
                <div key={item.name} className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}: <strong>{item.value}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Site Capacity Multi-Dimensional Comparison */}
      <div className="bg-command-900 border border-command-700/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-command-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Relocation Candidate Sites: Headroom Across 5 Infrastructure Dimensions
            </h2>
          </div>
          <span className="text-xs text-amber-400 font-mono">Bottleneck determines effective population absorption</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={siteCaps} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="site_name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="land_capacity" name="Land Cap (125/ha)" fill="#38bdf8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="water_capacity" name="Water Cap (100 LPCD)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="power_capacity" name="Power Cap (0.5kW/hh)" fill="#a855f7" radius={[2, 2, 0, 0]} />
              <Bar dataKey="health_capacity" name="Health PHC Headroom" fill="#ec4899" radius={[2, 2, 0, 0]} />
              <Bar dataKey="school_capacity" name="School Headroom" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tehsil Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tehsils.map((t: any) => (
          <div key={t.tehsil} className="p-4 bg-command-900 border border-command-800 rounded-xl space-y-2">
            <h3 className="font-bold text-white text-sm">{t.tehsil} Tehsil</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>Total Villages: <strong>{t.habitations_count}</strong></div>
              <div>Population: <strong>{t.total_population.toLocaleString()}</strong></div>
              <div>Immediate Tier: <strong className="text-red-400">{t.immediate_count}</strong></div>
              <div>Red Zone Count: <strong className="text-red-400">{t.red_zone_count}</strong></div>
            </div>
            <div className="pt-2 border-t border-command-800 text-[11px] text-slate-400 flex justify-between">
              <span>Avg Risk Score:</span>
              <strong className="text-amber-400 font-mono">{t.avg_risk}/100</strong>
            </div>
          </div>
        ))}
      </div>

      {roleConfig.showAdvancedAnalysis && (
        <div className="rounded-xl border border-amber-800/70 bg-amber-950/20 p-4 text-xs text-amber-100">
          <strong>Scientific data quality mode:</strong> Each habitation record includes terrain provenance, model confidence,
          hazard-factor importances, and data vintage for analytical review.
        </div>
      )}
    </div>
  );
};
