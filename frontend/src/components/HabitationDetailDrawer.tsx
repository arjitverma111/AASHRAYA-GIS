import React, { useState, useEffect } from 'react';
import { Habitation, UserRole, CandidateSite } from '../types';
import { api } from '../services/api';
import {
  X,
  AlertTriangle,
  Shield,
  MapPin,
  Users,
  Home,
  Activity,
  Droplets,
  Mountain,
  FileCheck,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface HabitationDetailDrawerProps {
  habitationId: string | null;
  onClose: () => void;
  userRole: UserRole;
  onActionComplete?: () => void;
}

export const HabitationDetailDrawer: React.FC<HabitationDetailDrawerProps> = ({
  habitationId,
  onClose,
  userRole,
  onActionComplete,
}) => {
  const [data, setData] = useState<{
    habitation: Habitation;
    recommended_candidate_sites: any[];
    audit_history: any[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'OVERRIDE' | 'REQUEST_DATA'>('APPROVE');
  const [selectedOverrideSite, setSelectedOverrideSite] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!habitationId) {
      setData(null);
      return;
    }

    setLoading(true);
    setSubmitFeedback(null);
    api
      .getHabitationDetail(habitationId)
      .then((res) => {
        setData(res);
        setLoading(false);
        if (res.recommended_candidate_sites && res.recommended_candidate_sites.length > 0) {
          setSelectedOverrideSite(res.recommended_candidate_sites[0].site_id);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [habitationId]);

  if (!habitationId) return null;

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || !data) return;

    setIsSubmitting(true);
    try {
      await api.submitApproval({
        habitation_id: data.habitation.id,
        action: actionType,
        operator_role: userRole,
        operator_name: `${userRole} Officer`,
        justification: justification,
        overridden_site_id: actionType === 'OVERRIDE' ? selectedOverrideSite : null,
      });

      setSubmitFeedback(`Decision '${actionType}' successfully recorded in audit log.`);
      setIsSubmitting(false);
      setJustification('');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      setSubmitFeedback('Error recording decision. Please retry.');
      setIsSubmitting(false);
    }
  };

  const h = data?.habitation;
  const risk = h?.risk;
  const priority = h?.priority;
  const hazards = h?.hazards;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[540px] bg-command-900 border-l border-command-700 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="px-5 py-3.5 bg-command-950 border-b border-command-700 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-700/60 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">{h?.name || 'Loading...'}</h2>
            <p className="text-xs text-slate-400">
              {h ? `${h.panchayat} Panchayat, ${h.tehsil} Tehsil | ${h.district}` : 'Fetching telemetry...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-command-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      {loading || !h ? (
        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3"></div>
          Analyzing habitation risk profile...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-command-950 p-2.5 rounded-lg border border-command-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Population</span>
              <p className="text-lg font-black text-white">{h.population.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">{h.households} households</span>
            </div>
            <div className="bg-command-950 p-2.5 rounded-lg border border-command-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">24h Rainfall</span>
              <p className="text-lg font-black text-cyan-400">{h.current_rainfall_24h_mm} mm</p>
              <span className="text-[10px] text-slate-500">IMD Gauge</span>
            </div>
            <div className="bg-command-950 p-2.5 rounded-lg border border-command-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Action Status</span>
              <p className="text-xs font-bold text-amber-400 mt-1">{h.approval_status || 'PENDING'}</p>
              <span className="text-[10px] text-slate-500">{h.assigned_site_id ? 'Assigned' : 'Unallocated'}</span>
            </div>
          </div>

          {/* Core Decision Engine Assessment Card */}
          <div className="bg-gradient-to-br from-command-950 to-command-850 p-4 rounded-xl border border-command-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Decision Engine Output
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide border ${
                  priority?.priority_tier === 'IMMEDIATE'
                    ? 'bg-red-950 text-red-300 border-red-600'
                    : priority?.priority_tier === 'SHORT_TERM'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-yellow-950 text-yellow-300 border-yellow-600'
                }`}
              >
                {priority?.priority_tier} PRIORITY
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-3xl font-black text-white">{risk?.composite_risk}</span>
                <span className="text-slate-400 text-sm font-semibold"> / 100</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400">Risk Band: </span>
                <span
                  className={`font-black text-xs ${
                    risk?.risk_band === 'RED'
                      ? 'text-red-400'
                      : risk?.risk_band === 'ORANGE'
                      ? 'text-orange-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {risk?.risk_band} ZONE
                </span>
              </div>
            </div>

            {/* Explainable Contributing Factors Waterfall */}
            <div className="space-y-1.5 mt-3 pt-3 border-t border-command-800 text-xs">
              <div className="font-bold text-slate-300 mb-1">Score Contribution Breakdown:</div>
              {risk?.contributing_factors && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Physical Hazard Severity</span>
                      <span className="font-bold text-white">
                        {risk.contributing_factors.hazard_contribution_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-command-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${risk.contributing_factors.hazard_contribution_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Population Exposure (Norm)</span>
                      <span className="font-bold text-white">
                        {risk.contributing_factors.population_exposure_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-command-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${risk.contributing_factors.population_exposure_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Census Demographic Vulnerability</span>
                      <span className="font-bold text-white">
                        {risk.contributing_factors.vulnerability_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-command-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${risk.contributing_factors.vulnerability_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Disaster Frequency (10yr)</span>
                      <span className="font-bold text-white">
                        {risk.contributing_factors.disaster_history_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-command-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${risk.contributing_factors.disaster_history_pct}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Plain-Language Explanation */}
            <div className="mt-3.5 p-3 rounded-lg bg-command-950/80 border border-command-700/60 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold block mb-1">Decision Rationale:</strong>
              {risk?.human_readable_explanation}
            </div>
          </div>

          {/* Detailed Hazard Subscores */}
          <div className="bg-command-950 p-4 rounded-xl border border-command-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Multi-Hazard Subscores</span>
              <span className="text-[10px] text-slate-500 font-mono">Max-Rule Composite</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-command-900 rounded border border-command-800 text-center">
                <span className="text-[10px] text-slate-400 block">Landslide (ML)</span>
                <span className="text-base font-bold text-red-400">
                  {hazards?.landslide_score ? Math.round(hazards.landslide_score * 100) : 0}%
                </span>
              </div>
              <div className="p-2 bg-command-900 rounded border border-command-800 text-center">
                <span className="text-[10px] text-slate-400 block">Flood (HAND)</span>
                <span className="text-base font-bold text-blue-400">
                  {hazards?.flood_score ? Math.round(hazards.flood_score * 100) : 0}%
                </span>
              </div>
              <div className="p-2 bg-command-900 rounded border border-command-800 text-center">
                <span className="text-[10px] text-slate-400 block">Cloudburst</span>
                <span className="text-base font-bold text-purple-400">
                  {hazards?.cloudburst_score ? Math.round(hazards.cloudburst_score * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Top Contributing Terrain Features */}
            {hazards?.top_terrain_factors && hazards.top_terrain_factors.length > 0 && (
              <div className="mt-2 text-xs space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Top Physical Terrain Influences:</span>
                {hazards.top_terrain_factors.slice(0, 3).map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300 py-0.5">
                    <span>• {f.description}</span>
                    <span className="text-red-400 font-mono font-semibold">
                      +{Math.round(f.importance_weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demographic Vulnerability Indices */}
          <div className="bg-command-950 p-4 rounded-xl border border-command-800 space-y-2.5 text-xs">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Demographic Vulnerability Indicators (Census 2011)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between p-1.5 bg-command-900 rounded border border-command-800">
                <span className="text-slate-400">Elderly Population:</span>
                <span className="font-bold text-white">{Math.round(h.demographics.elderly_pct * 100)}%</span>
              </div>
              <div className="flex justify-between p-1.5 bg-command-900 rounded border border-command-800">
                <span className="text-slate-400">Children (0-6y):</span>
                <span className="font-bold text-white">{Math.round(h.demographics.children_pct * 100)}%</span>
              </div>
              <div className="flex justify-between p-1.5 bg-command-900 rounded border border-command-800">
                <span className="text-slate-400">Kutcha Dwellings:</span>
                <span className="font-bold text-red-400">{Math.round(h.demographics.kutcha_housing_pct * 100)}%</span>
              </div>
              <div className="flex justify-between p-1.5 bg-command-900 rounded border border-command-800">
                <span className="text-slate-400">Nearest Hospital:</span>
                <span className="font-bold text-amber-400">{h.infrastructure_distances_km.nearest_hospital} km</span>
              </div>
            </div>
          </div>

          {/* Candidate Relocation Sites Recommendations */}
          <div className="bg-command-950 p-4 rounded-xl border border-command-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Top Matched Relocation Candidate Sites
            </span>

            <div className="space-y-2">
              {data.recommended_candidate_sites?.map((site, index) => (
                <div
                  key={site.site_id}
                  className="p-3 bg-command-900 rounded-lg border border-command-700/70 hover:border-emerald-500/50 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center text-[10px]">
                        #{index + 1}
                      </span>
                      <span>{site.site_name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono">
                      {Math.round(site.suitability_score * 100)}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 mt-1.5">
                    <div>Dist: <strong className="text-white">{site.distance_km} km</strong></div>
                    <div>Safe Cap: <strong className="text-emerald-400">{site.effective_capacity.toLocaleString()}</strong></div>
                    <div>Road: <strong className="text-white">{site.road_access}</strong></div>
                  </div>
                  <div className="text-[10px] text-amber-400/90 mt-1">
                    Constraint: {site.binding_constraint}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human-in-the-Loop Governance Action Form */}
          <div className="bg-command-950 p-4 rounded-xl border border-command-700 space-y-3">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Human Authority Sign-Off ({userRole})
              </span>
            </div>

            <form onSubmit={handleApprovalSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'APPROVE', label: 'Approve Plan' },
                  { id: 'OVERRIDE', label: 'Override Site' },
                  { id: 'REQUEST_DATA', label: 'Request Data' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActionType(act.id as any)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                      actionType === act.id
                        ? 'bg-command-700 text-white border-emerald-500 shadow-inner'
                        : 'bg-command-900 text-slate-400 border-command-800 hover:bg-command-850'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {actionType === 'OVERRIDE' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Select Alternate Safe Site:</label>
                  <select
                    value={selectedOverrideSite}
                    onChange={(e) => setSelectedOverrideSite(e.target.value)}
                    className="w-full bg-command-900 border border-command-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {data.recommended_candidate_sites?.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.site_name} ({s.distance_km} km, Cap: {s.effective_capacity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Official Justification / Audit Reason (Mandatory):
                </label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Enter administrative rationale for RTI and State Review compliance..."
                  className="w-full bg-command-900 border border-command-700 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {submitFeedback && (
                <div className="text-xs text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-800">
                  {submitFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !justification.trim()}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 transition-all shadow-lg shadow-red-950/40"
              >
                {isSubmitting ? 'Logging to Audit Trail...' : 'Submit Official Action to Audit Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
