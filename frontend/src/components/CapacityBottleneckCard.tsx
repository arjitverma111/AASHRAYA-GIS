import React from 'react';
import { CandidateSite } from '../types';
import { ShieldCheck, Droplets, Zap, HeartPulse, GraduationCap, Map, AlertCircle } from 'lucide-react';

interface CapacityBottleneckCardProps {
  site: CandidateSite;
  isAllocated?: boolean;
}

export const CapacityBottleneckCard: React.FC<CapacityBottleneckCardProps> = ({ site, isAllocated }) => {
  const caps = site.capacities;
  const isExcluded = site.is_inside_hazard_zone || site.is_protected_eco_area;

  const dimensions = [
    { name: 'Land Availability', value: caps.land_capacity, icon: Map, unit: 'persons (125/ha)' },
    { name: 'Water Headroom', value: caps.water_capacity, icon: Droplets, unit: 'persons (100 LPCD)' },
    { name: 'Power Substation', value: caps.power_capacity, icon: Zap, unit: 'persons (0.5 kW/hh)' },
    { name: 'Healthcare (PHC)', value: caps.health_capacity, icon: HeartPulse, unit: 'persons headroom' },
    { name: 'School Classrooms', value: caps.school_capacity, icon: GraduationCap, unit: 'persons (RTE norm)' },
  ];

  // Raw minimum
  const minDimensionValue = Math.min(...dimensions.map(d => d.value));

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isExcluded
        ? 'bg-command-950/60 border-red-900/60 opacity-75'
        : 'bg-command-900 border-command-700/80 hover:border-emerald-500/50 shadow-lg'
    }`}>
      {/* Site Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white">{site.name}</h3>
            {isExcluded ? (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-950 text-red-400 border border-red-800 rounded">
                HARD EXCLUDED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                APPROVED SAFE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{site.panchayat}, {site.tehsil} | {site.usable_area_ha} ha usable</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Safety Score</span>
          <p className="text-base font-black text-emerald-400">{Math.round(site.safety_score * 100)}/100</p>
        </div>
      </div>

      {/* Bottleneck Alert Banner */}
      <div className={`p-2.5 rounded-lg mb-3 flex items-center space-x-2 text-xs ${
        isExcluded
          ? 'bg-red-950/70 border border-red-800/80 text-red-300'
          : 'bg-amber-950/50 border border-amber-800/60 text-amber-200'
      }`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <div>
          <strong className="font-semibold block text-[11px]">Binding Constraint (Bottleneck):</strong>
          <span className="text-slate-300">{site.binding_constraint || 'None identified'}</span>
        </div>
      </div>

      {/* 5-Dimensional Capacity Headroom Grid */}
      <div className="space-y-2 mb-3">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          const isBinding = dim.value === minDimensionValue;
          const percent = Math.min((dim.value / 6500) * 100, 100);

          return (
            <div key={dim.name} className="text-xs">
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Icon className={`w-3.5 h-3.5 ${isBinding ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className={isBinding ? 'font-bold text-amber-300' : ''}>
                    {dim.name} {isBinding && '(BINDING)'}
                  </span>
                </div>
                <span className="font-mono text-white font-semibold">
                  {dim.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-command-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isBinding ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-command-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Effective Net Capacity with Buffer */}
      <div className="pt-2.5 border-t border-command-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Effective Capacity (with 15% Buffer)</span>
          <p className="text-base font-black text-emerald-400">
            {site.effective_capacity?.toLocaleString() || '0'} <span className="text-xs text-slate-400 font-normal">people</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Existing Baseline</span>
          <p className="text-xs font-mono text-slate-300">
            {site.existing_population.toLocaleString()} pop
          </p>
        </div>
      </div>
    </div>
  );
};
