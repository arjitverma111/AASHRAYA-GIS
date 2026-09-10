import React from 'react';
import { BookOpen, Shield, Cpu, Droplets, Database, Scale, CheckCircle2, Info } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="p-4 lg:p-6 space-y-8 max-w-5xl mx-auto text-slate-200">
      {/* Title */}
      <div className="border-b border-command-800 pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-command-800 border border-command-700 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">
              AASHRAYA-GIS Decision Science & Mathematical Methodology
            </h1>
            <p className="text-xs text-slate-400">
              Formulas, Planning Standards, Operations Research Models, and Data Provenance
            </p>
          </div>
        </div>
      </div>

      {/* Synthetic Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 text-xs text-blue-200 flex items-start space-x-3">
        <Info className="w-5 h-5 flex-shrink-0 text-cyan-400 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-sm font-bold text-white block">Data Provenance & Prototype Notice</strong>
          <p>
            This hackathon decision-support system is calibrated for <strong>Wayanad District, Kerala</strong>.
            Demographic figures are sourced from the published <em>Census 2011 Village Directory / SHRUG dataset</em>;
            terrain slopes and hydrological elevations are derived from <em>SRTM 30m DEM</em>; rainfall events replay
            historical extreme downpours from <em>IMD Gridded Archives</em> (July 2024 & August 2019). Infrastructure
            carrying capacity metrics reflect statutory Indian planning guidelines.
          </p>
        </div>
      </div>

      {/* Section 1: Multi-Hazard Formulation */}
      <div className="bg-command-900 border border-command-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-command-800 pb-3">
          <Shield className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            1. Multi-Hazard Composite Index: Max-Rule-Plus-Residual
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Standard weighted averages suffer from a dangerous flaw in multi-hazard disaster planning: a village located on
          an active, catastrophic landslide scarp could have its overall score diluted by a zero flood score. AASHRAYA-GIS
          implements the legally defensible <strong>Max-Rule-Plus-Residual</strong> formulation (PRD §5):
        </p>

        <div className="bg-command-950 p-4 rounded-xl border border-command-800 font-mono text-xs text-amber-300 space-y-2">
          <div>MaxHazard = max(w_ls · H_landslide, w_fl · H_flood, w_cb · H_cloudburst)</div>
          <div>HazardIndex = min(1.0, MaxHazard + λ · ∑(other_hazards))  [where λ = 0.15]</div>
          <div className="text-slate-400 text-[11px] pt-1 border-t border-command-800">
            CompositeRisk = 100 · (0.40 · HazardIndex + 0.25 · Exposure_norm + 0.20 · VulnerabilityIndex + 0.15 · History_norm)
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <strong>Red Zone Floor Rule:</strong> If any single hazard subscore exceeds <strong>0.85</strong>, the habitation
          is automatically classified into the <strong>RED ZONE</strong> regardless of the composite average.
        </div>
      </div>

      {/* Section 2: Carrying Capacity Bottleneck Logic */}
      <div className="bg-command-900 border border-command-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-command-800 pb-3">
          <Droplets className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            2. Multi-Dimensional Carrying Capacity & Bottleneck Determination
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Carrying capacity is not a scalar land-area number. A 40-hectare site with only one tube well is capacity-constrained
          by water, not land. The platform calculates maximum supportable population across five independent infrastructure dimensions
          and identifies the limiting <strong>Binding Constraint</strong> with a mandatory 15% planning buffer (PRD §9):
        </p>

        <div className="bg-command-950 p-4 rounded-xl border border-command-800 font-mono text-xs text-cyan-300 space-y-1.5">
          <div>LandCapacity   = UsableArea_ha × 125 persons/ha  (Rural Resilient Density Norm)</div>
          <div>WaterCapacity  = NetSupply_LPD / 100 LPCD        (Jal Jeevan Mission / MoHUA Norm)</div>
          <div>PowerCapacity  = (SubstationHeadroom_kW / 0.5 kW/hh) × 4.5 persons/hh</div>
          <div>HealthCapacity = PHCCapacity - ExistingCatchment (PHC Norm 30,000 catchment)</div>
          <div>SchoolCapacity = ClassroomHeadroom × 40 students (Right to Education Norm)</div>
          <div className="text-amber-300 font-bold pt-2 border-t border-command-800">
            EffectiveCapacity = floor(min(Land, Water, Power, Health, School) × 0.85 SafetyMargin)
          </div>
        </div>
      </div>

      {/* Section 3: Operations Research MILP Optimization */}
      <div className="bg-command-900 border border-command-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-command-800 pb-3">
          <Scale className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            3. Operations Research: Mixed-Integer Linear Programming (MILP)
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Unlike greedy heuristics or genetic approximations, AASHRAYA-GIS solves the Village-to-Site Relocation Assignment
          as a provably optimal Mixed-Integer Linear Program (MILP) solved via the <strong>Coin-or Branch and Cut (CBC)</strong> solver (PRD §10):
        </p>

        <div className="bg-command-950 p-4 rounded-xl border border-command-800 font-mono text-xs text-emerald-300 space-y-2">
          <div>minimize ∑_(i, j) Cost_(i, j) · x_(i, j) + ∑_i 1000.0 · u_i</div>
          <div>subject to:</div>
          <div>  ∑_j x_(i, j) + u_i = 1             (Every village either assigned or escalated via slack u_i)</div>
          <div>  ∑_i Pop_i · x_(i, j) ≤ AvailableCap_j (Site carrying capacity never exceeded)</div>
          <div>  d_(i, j) ≤ 35 km                   (Operational relocation radius constraint)</div>
          <div>  x_(i, j) ∈ &#123;0, 1&#125;,  u_i ∈ &#123;0, 1&#125;</div>
        </div>

        <div className="p-3 bg-command-950 rounded-lg border border-command-800 text-xs text-slate-300">
          <strong className="text-amber-300 font-semibold block mb-1">Infeasibility Handling (FR-15):</strong>
          If regional candidate sites lack sufficient capacity or exceed distance bounds, the solver activates the slack variable
          <code className="text-red-400 font-mono"> u_i = 1</code> and flags the habitation as <strong>"ESCALATE TO STATE DMA"</strong>
          with the exact bottleneck reason rather than forcing an unsafe match or dropping population.
        </div>
      </div>

      {/* Section 4: Indian Planning Standards Reference Table */}
      <div className="bg-command-900 border border-command-700/80 rounded-2xl p-6 shadow-xl space-y-3">
        <h2 className="text-base font-bold text-white uppercase tracking-wider border-b border-command-800 pb-3">
          4. Statutory Indian Disaster Management & Planning Norms
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-command-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Infrastructure Dimension</th>
                <th className="py-2 px-3">Planning Norm</th>
                <th className="py-2 px-3">Statutory Source</th>
                <th className="py-2 px-3">Application in AASHRAYA-GIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-command-800 text-slate-300 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Domestic Water Supply</td>
                <td className="py-2.5 px-3 font-mono">100 LPCD</td>
                <td className="py-2.5 px-3">Jal Jeevan Mission / CPHEEO</td>
                <td className="py-2.5 px-3">Divisor for total net daily water supply headroom</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Rural Resilient Density</td>
                <td className="py-2.5 px-3 font-mono">125 persons / hectare</td>
                <td className="py-2.5 px-3">URDPFI Guidelines (MoHUA)</td>
                <td className="py-2.5 px-3">Max physical land occupancy ceiling per candidate site</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Household Electricity</td>
                <td className="py-2.5 px-3 font-mono">0.5 kW / household (4.5 pp)</td>
                <td className="py-2.5 px-3">CEA Rural Electrification Norms</td>
                <td className="py-2.5 px-3">Calculates distribution substation feeder headroom</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Primary Healthcare (PHC)</td>
                <td className="py-2.5 px-3 font-mono">1 PHC per 30,000 population</td>
                <td className="py-2.5 px-3">Indian Public Health Standards (IPHS)</td>
                <td className="py-2.5 px-3">Limits influx based on residual clinic capacity</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Carrying Capacity Buffer</td>
                <td className="py-2.5 px-3 font-mono">15% Safety Margin (η = 0.85)</td>
                <td className="py-2.5 px-3">NDMA National Guidelines</td>
                <td className="py-2.5 px-3">Prevents resource exhaustion during disaster resettlement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
