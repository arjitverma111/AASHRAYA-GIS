# Problem Statement 26191 — Strategic & Technical Analysis
**Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations**
NDRF (DM Division), Ministry of Home Affairs

> This is Part A: the reasoning behind the design. Part B (`02-PRD.md`) is the buildable spec. Read this first if you're deciding what to actually build; read the PRD if you're assigned a component and need to know exactly what to code.

---

## 1. Deconstructing the problem

The problem statement's own wording — "which villages are dangerous" — is a trap. If the prototype only answers that, it's a hazard map, and hazard maps already exist (Bhuvan's Landslide Atlas has ~80,000 mapped landslides; CWC already issues flood forecasts). A hazard map doesn't help a District Magistrate decide whether to spend the relocation budget on Village A or Village B this year. The problem statement itself says this explicitly: *"assess carrying capacity"* and *"prioritize... for relocation"* are decision-allocation problems, not visualization problems.

Splitting the problem by layer:

| Layer | Question |
|---|---|
| **Stated problem** | Identify red zones, assess site carrying capacity, prioritize relocation |
| **Underlying problem** | India has no standing, evidence-based, update-able answer to "who should move, and where, first" — decisions are made reactively, post-disaster, under political and emotional pressure |
| **Operational problem** | A District/State DMA official has a fixed relocation budget and no engineering basis for sequencing villages, and no way to defend that sequencing later (RTI, legal challenge, community pushback) |
| **Data problem** | Hazard data, population data, and infrastructure data live in different silos (NRSC, IMD, CWC, Census, State PWD) at different resolutions and update cadences; nobody has fused them at habitation level |
| **Decision-making problem** | Multi-criteria trade-offs (safer-but-farther vs. closer-but-riskier site) have no formal, auditable method — decisions are made informally |
| **Human/social problem** | Relocation breaks livelihoods, kinship networks, and land ties; a technically "optimal" site that ignores this will be resisted or reversed |
| **Technical problem** | Fusing heterogeneous geospatial + tabular + time-series data into a habitation-level, explainable, continuously-updating risk-to-recommendation pipeline |

**What an official actually needs to know**, in order, before signing off on a relocation decision:

1. Is this habitation at risk, and from which hazard(s)?
2. How severe, and how confident are we?
3. How many people, and how vulnerable are they specifically (not just "population")?
4. How urgent — this monsoon, this year, this decade?
5. Where could they go, and is that place actually safe and *not just less obviously unsafe*?
6. Can that place physically absorb them (water, power, roads, schools, health)?
7. What is the cost/disruption of the move, and is there a materially better alternative?
8. What is the evidence trail, so the decision survives scrutiny?

Everything downstream in this document is built to answer these eight questions, not to produce a prettier map.

---

## 2. Solution approaches considered

| Approach | Solves | Data needed | Advantages | Limitations | Complexity | Hackathon feasibility | Production feasibility |
|---|---|---|---|---|---|---|---|
| GIS weighted overlay | Combining hazard layers into a composite score | Raster layers (slope, rainfall, land cover, etc.) | Simple, transparent, fast | Weights are subjective unless calibrated; static | Low | High | Medium (needs calibration) |
| MCDA (AHP/TOPSIS) | Structuring multi-factor suitability (site selection, priority ranking) | Criteria + expert/pairwise weights | Formal, auditable, widely used in govt planning | Weight elicitation is still subjective; doesn't learn from outcomes | Low–Med | High | High |
| Rule-based risk scoring | Deterministic, explainable classification (e.g. red/orange/yellow zone) | Thresholds per hazard | Fully explainable, easy to defend legally | Can't capture nonlinear interactions between hazards | Low | High | High |
| Statistical models (logistic regression) | Probability of hazard occurrence from historical events | Historical event + covariate data | Explainable, well-understood, small-data friendly | Assumes linearity/independence unless engineered | Low–Med | High | High |
| Classical ML (Random Forest / XGBoost) | Landslide/flood susceptibility classification from many correlated variables | Labelled historical hazard inventory + terrain/climate covariates | Handles nonlinearity, gives feature importance, robust with medium data | Needs a real inventory to train on; still needs calibration | Medium | High | High |
| Deep learning (CNN / U-Net) | Pixel-wise hazard/flood-extent segmentation from satellite imagery | Large labelled imagery datasets, GPU | Best raw accuracy for image segmentation at scale | Data-hungry, opaque, overkill without a real imagery-labelling pipeline; hackathon teams rarely have time to train these properly | High | Low | Medium (only once you have imagery + labels at scale) |
| Remote sensing change detection | Detecting new erosion, deforestation, encroachment over time | Multi-date satellite imagery (Sentinel/Landsat) | Directly observes ground truth change, not a proxy | Cloud cover, revisit frequency, needs image-processing pipeline | Medium | Medium | High |
| Hydrological modelling (HAND, TWI, flow accumulation) | Physically-grounded flood extent estimation | DEM only | Deterministic, no training data needed, scientifically defensible | Coarse without high-res DEM; ignores land-use/drainage infrastructure | Medium | High | High |
| Time-series / LSTM | Forecasting rainfall-triggered hazard probability | Long historical time series | Captures temporal dynamics | Needs long clean series; hard to explain; marginal gain over threshold rules at hackathon scale | High | Low | Medium |
| Agent-based modelling | Simulating population movement/behaviour during relocation | Behavioural assumptions, social network data | Captures social dynamics ignored elsewhere | Heavy assumptions, not verifiable in a hackathon timeframe | High | Very low | Low (research-grade) |
| Digital twin | Full simulation of a settlement for what-if analysis | All of the above, integrated, high fidelity | Great narrative, supports iterative planning | Effectively a full production system; a hackathon "digital twin" is usually just the map with an extra name | Very high | Low (as a demo gimmick) | Medium–High (long-term vision) |
| Knowledge graphs | Representing habitation–hazard–infrastructure–site relationships explicitly | Structured entity/relationship data | Excellent for explainability and querying ("why") | Extra engineering layer with limited hackathon payoff over a relational DB | Medium | Low–Medium | Medium |
| Graph Neural Networks | Learning over spatial/relational structure (e.g. drainage networks) | Graph-structured data, labels | Powerful for network-structured hazards (flood routing) | Very hard to justify or debug in a hackathon; explainability is poor | High | Very low | Low (research-grade) |
| Optimization: LP / MIP | Assigning villages to relocation sites under capacity constraints | Cost/distance/capacity matrix | Provably optimal, fast to solve at hackathon scale (tens of villages/sites), fully explainable via constraints | Needs the cost/capacity model to be reasonably accurate | Medium | High | High |
| Genetic algorithms | Same allocation problem, more flexible objective | Same + more tuning | Handles non-convex, multi-objective cases | Slower, no optimality guarantee, harder to explain "why this assignment" to a government reviewer | Medium–High | Low–Medium | Medium |
| Min-cost flow | Special case of the allocation problem | Same as MIP, bipartite structure | Very fast, exact, simple to implement | Only handles linear costs / single-commodity assignment cleanly | Medium | High | High |

**Verdict going in**: no single approach wins. The right system is a **pipeline of narrow, mostly-deterministic-or-classical-ML stages**, each independently explainable, connected by a genuine optimization step at the allocation stage — not one end-to-end model, and not a weighted-overlay map with an AI label stapled on.

---

## 3. The hybrid architecture: what uses what, and why

| Stage | Method | Why |
|---|---|---|
| Terrain hazard factors (slope, aspect, TWI, HAND) | **Deterministic GIS** (raster algebra on DEM) | Physically defined, no training data needed, fully reproducible |
| Landslide/flood susceptibility classification | **Classical ML** (Random Forest / XGBoost / Logistic Regression) trained on NRSC's landslide inventory + terrain/rainfall covariates | Nonlinear interactions between many correlated terrain variables genuinely benefit from ML; the inventory (~80,000 mapped landslides) is a real, if imperfect, label source. Feature importances double as explanations. |
| Flood extent (baseline) | **Deterministic hydrological model** (HAND / flow accumulation on DEM) | No training data required, physically grounded, good enough for a first-cut zone at hackathon resolution |
| Rainfall-triggering probability | **Logistic regression / threshold rule** on antecedent + forecast rainfall | Small feature set, needs to be auditable ("above 150mm/24h in a known-susceptible zone = trigger"), not a deep model |
| Multi-hazard combination | **Deterministic weighted/normalized index**, not ML | A DM official must be able to see exactly how a 0–100 score was built from hazard sub-scores; a black-box combiner is a legal and trust liability |
| Vulnerability index | **Deterministic weighted index** (census + infra proxies) | Same explainability requirement; also the underlying data (Census 2011) is too coarse/stale to justify a learned model |
| Relocation priority score | **Deterministic, transparent formula** over hazard × exposure × vulnerability × urgency | This is the number an official will be asked to defend in front of a committee — it must be a formula, not a prediction |
| Safe-site suitability | **MCDA / weighted score over GIS layers** | Same logic; site suitability is a policy judgment encoded as weights, not a pattern to be learned |
| Carrying capacity | **Deterministic constraint model** (bottleneck of land/water/power/road/health/school capacity) | This is arithmetic and domain thresholds, not a prediction problem |
| Village → site assignment | **Optimization (MIP / min-cost flow)** | This is the one stage that is *genuinely* a hard combinatorial problem non-trivial for a human to solve by hand once you have >~10 villages and >~5 sites — real value-add, not AI-washing |
| Real-time hazard update | **Rule-triggered recomputation** on new rainfall/satellite data | Deterministic pipeline re-run, not continuous retraining |
| Every recommendation | **Human-in-the-loop approval** | The system never auto-executes a relocation; District/State officials approve, override, and annotate every recommendation |

This is deliberately AI-light. Only two components (landslide susceptibility classification, and optionally flood-extent refinement) use ML in the strict sense; everything else is classical GIS, statistics, or operations research. That is the correct engineering answer, and Part 2 (Judge Perspective) addresses head-on the risk that this reads as "not enough AI" for an AI-hackathon audience.

---

## 4. Core pipeline

```
Hazard Detection → Hazard Mapping → Risk Assessment → Vulnerability Assessment
→ Red-Zone Classification → Population Impact → Relocation Priority
→ Candidate Site Identification → Carrying Capacity → Allocation (Optimization)
→ Route Planning → Decision (human-in-loop) → Monitoring / Re-trigger
```

| Stage | Input | Processing | Algorithm | Output | Consumer | Feeds into |
|---|---|---|---|---|---|---|
| Hazard Detection | DEM, rainfall, land cover, historical inventory | Feature engineering per hazard | RF/XGBoost (landslide), HAND (flood), rule (cloudburst), CVI (coastal) | Per-hazard probability/susceptibility raster | Risk engine | Hazard Mapping |
| Hazard Mapping | Per-hazard rasters | Normalize 0–1, tile to habitation footprints | Zonal statistics | Habitation-level hazard scores | Risk engine | Risk Assessment |
| Risk Assessment | Hazard scores + exposure (population) | Multi-hazard combination | Weighted index / max-hazard override rule | Composite risk score + band | Vulnerability engine, dashboard | Red-Zone Classification |
| Vulnerability Assessment | Census/SECC, infra distance | Weighted vulnerability index | Deterministic formula | Vulnerability score | Priority engine | Population Impact |
| Red-Zone Classification | Risk score | Threshold into bands | Rule-based | Zone label (Safe/Watch/Red-Immediate) | Officials, dashboard | Population Impact |
| Population Impact | Zone + population data | Overlay | GIS join | Affected population count, demographic breakdown | Priority engine | Relocation Priority |
| Relocation Priority | Risk + exposure + vulnerability + urgency | Weighted formula | Deterministic, explainable | Priority score + tier (Immediate/Short/Medium/None) | Officials | Site matching |
| Candidate Site ID | Land use, hazard layers, admin boundaries | Filter out unsafe/protected/occupied land | GIS query + MCDA | Ranked candidate sites | Optimization engine | Carrying Capacity |
| Carrying Capacity | Site infra data | Bottleneck/min-constraint calculation | Deterministic | Max additional population per site | Optimization engine | Allocation |
| Allocation | Villages, sites, capacities, distances | Assignment optimization | MIP / min-cost flow | Village→site assignment plan | Officials | Route Planning |
| Route Planning | Assignment + road network | Shortest/safest path | Network analysis (e.g. OSRM) | Recommended relocation/evacuation routes | NDRF, local admin | Decision |
| Decision | Full evidence package | Human review | — | Approved/modified/rejected plan | State/District DMA | Monitoring |
| Monitoring | New rainfall/satellite/event data | Trigger check | Rule-based | Re-run flag | Pipeline (loop back to Hazard Detection) | — |

---

## 5. Multi-hazard red-zone engine

Per-hazard variable sets (as specified in the brief) are all standard and available at national scale — see §13. The design decisions that matter:

- **Combine hazards additively per-pixel, then take the maximum across hazards as a floor, not a pure weighted average.** Rationale: a village with catastrophic landslide risk but low flood risk should not have its overall score diluted by averaging with the (irrelevant) flood score. Formally: `RiskIndex = max(w1·H_landslide, w2·H_flood, w3·H_coastal, w4·H_cloudburst) + λ·Σ(other hazards)`, with λ small (e.g. 0.1) so co-occurring hazards still push the score up without a single low score dragging the composite down.
- **Represent the Red Zone as both a continuous score (0–100) and a discretized band (Green/Watch/Orange/Red)**, not binary. Binary "red zone / not red zone" invites exactly the legal and political disputes the brief warns about ("why is my village red but the one next door isn't"); a continuous, banded score with visible sub-scores is defensible and supports "short-term vs. immediate" tiering later.
- **Keep hazard-specific scores visible alongside the composite** — an official needs to know *which* hazard is driving the classification, since that determines the type of intervention (embankment vs. slope stabilization vs. relocation).

---

## 6. Vulnerability engine

The brief is right to flag that Hazard, Exposure, Vulnerability, and Risk are not interchangeable:

- **Hazard** = probability/intensity of the physical event (independent of who lives there).
- **Exposure** = how many people/assets are in the hazard's footprint.
- **Vulnerability** = how much harm those people would suffer *given* exposure (a wealthy, well-built, well-connected settlement in a flood zone is exposed but less vulnerable than a poor settlement with no road access to it).
- **Risk** = the resulting expected impact — a function of all three: `Risk ≈ Hazard × Exposure × Vulnerability` (conceptually; the actual priority formula in §7 uses a bounded weighted-sum, not a raw product, so that a zero in one factor doesn't zero out the whole score).

Vulnerability Index (deterministic, weighted, 0–1 normalized): population density, % elderly/children, % persons with disabilities, housing quality proxy (Census "kutcha/pucca" housing %), distance to nearest health facility, distance to nearest all-weather road, historical disaster exposure count, livelihood dependency on the immediate area (agriculture/fishing % from Census). Weights should be presented as configurable, with a documented default set (e.g. via a simple AHP pairwise comparison the team does themselves) — this is a policy choice the platform should expose, not hide.

---

## 7. Relocation priority engine

```
PriorityScore = w1·HazardSeverity + w2·PopulationExposed(normalized)
              + w3·VulnerabilityIndex + w4·HistoricalDisasterFrequency
              + w5·(1 − SafeSiteAvailability)
```
Each term normalized 0–1; weights sum to 1; defaults documented and adjustable per state. Bands: `Immediate` (≥0.75 or hazard sub-score alone ≥0.9), `Short-term` (0.5–0.75), `Medium-term` (0.3–0.5), `Monitor` (<0.3).

Every score renders as a breakdown, e.g.:
```
Relocation Priority: IMMEDIATE (0.87)
 ├─ Flood hazard: 0.91
 ├─ Landslide hazard: 0.74 (composite hazard, max-rule: 0.91)
 ├─ Population exposed: 4,210 (normalized 0.68)
 ├─ Vulnerability index: 0.82
 ├─ Historical events (10yr): 3 (High)
 └─ Safe site available within 15km: Yes
```
This directly satisfies the brief's "why is this village ranked #3" requirement — it's not a UI nicety, it's the core design constraint on the formula (§ this is why it's a weighted sum of named, inspectable terms, not a model output).

---

## 8. Safe site suitability

`SiteSuitability = Safety(1 − site's own hazard score) × InfraAccessScore × SocioeconomicScore × EnvironmentalConstraintFlag`

Hard exclusions (not scored, filtered out entirely): inside any hazard red zone itself, inside notified forest/protected/eco-sensitive area, inside another habitation's revenue land without documented availability. Soft-scored: distance to roads/power/water/health/schools, distance from origin village (livelihood continuity), employment opportunity proxy (nearest town/market distance), existing land use compatibility.

---

## 9. Carrying capacity engine

Carrying capacity is **multi-dimensional and bottleneck-based**, not a single number derived from land area alone — a site with abundant land but one working borewell is capacity-limited by water, not land. Compute each dimension's max-additional-population independently, then take the **minimum**:

```
Capacity(site) = min(
   LandCapacity      = UsableArea_ha × 25 people/ha (typical rural density norm),
   WaterCapacity      = (SafeYield_Lpd − CurrentDemand_Lpd) / 100 Lpcd,
   PowerCapacity      = (SubstationHeadroom_kW) / 0.5 kW per household × 4.5 people/hh,
   RoadCapacity       = f(existing road class, informational — flags a hard constraint rather than a number pre-hackathon),
   HealthCapacity     = (PHC design capacity − current catchment population),
   SchoolCapacity     = (School design capacity − current enrollment) × household multiplier
) × SafetyMargin (e.g. 0.85, to avoid recommending 100% utilization)
```

**Worked example**: Site A — 40 ha usable land (→ 1,000 people by land alone), water headroom sufficient for 3,200 people, power headroom for 4,000, one PHC with headroom for 2,850 people, one school with headroom for 3,400. Binding constraint = health infrastructure → **Site A can safely accommodate 2,850 additional people**, and the dashboard shows *why* (health, not land, is the bottleneck) — which also tells planners exactly what to invest in if they want to raise the site's capacity.

---

## 10. Relocation optimization

With N villages and M candidate sites, this is a **transportation/assignment problem with capacity constraints** — a textbook case for **Mixed-Integer Linear Programming**, solvable in milliseconds at hackathon scale (tens of villages, single-digit sites) with open-source solvers (PuLP/CBC, or Google OR-Tools).

```
minimize   Σ_ij  x_ij · Cost_ij
subject to Σ_j x_ij = 1                         (every village assigned to exactly one site — or split-allowed variant)
           Σ_i Population_i · x_ij ≤ Capacity_j  (site capacity respected)
           x_ij ∈ {0,1}
Cost_ij = α·Distance_ij + β·(1 − SiteSafety_j) + γ·InfraCost_ij + δ·LivelihoodDisruption_ij
```

Genetic algorithms and unconstrained heuristics were considered and rejected for the MVP: at hackathon scale the problem is small enough that exact MIP solving is fast and — critically — **the optimizer's output is provably optimal given the stated weights**, which is a far stronger explainability story for judges and for a real government reviewer than "the genetic algorithm converged on this solution."

---

## 11. Temporal / real-time intelligence

| Tier | Examples | Update cadence |
|---|---|---|
| Static | DEM, geology, protected area boundaries | Effectively fixed; re-ingest yearly |
| Slowly changing | Census/population, land cover, infrastructure inventory | Annually / on new Census-equivalent release |
| Real-time / near-real-time | Rainfall (IMD), river levels (CWC), satellite change detection | Hourly to daily |

Event-driven recompute example: `Heavy rainfall alert (IMD/CWC) → recompute landslide/flood hazard sub-scores for affected districts only → recompute composite risk + priority for habitations in those districts → flag any tier change → push alert to District/State dashboard`. For the hackathon, this is simulated with a manual "inject rainfall event" control that re-runs the pipeline live during the demo — genuinely showing the dynamic-update requirement without needing a live production data feed.

---

## 12. AI/ML components (detail)

| Model | Problem | Features | Output | Candidates | Training data | Inference freq | Explainability | Metric | Failure modes |
|---|---|---|---|---|---|---|---|---|---|
| Landslide susceptibility | Classify terrain susceptibility | Slope, aspect, elevation, TWI, geology, rainfall, land cover, distance to road-cuts, NDVI | Susceptibility probability 0–1 | Random Forest / XGBoost (chosen over CNN — tabular terrain features, no need for raw imagery at hackathon scale) | NRSC Landslide Atlas inventory + terrain covariates (public sample or synthetic-if-unavailable, clearly labelled) | Batch, on data refresh | Feature importance / SHAP | AUC-ROC, F1 | Sparse inventory in unmapped districts; extrapolation beyond training terrain types |
| Flood-extent refinement (optional, stretch) | Improve on pure HAND baseline | HAND value, rainfall accumulation, land cover, historical flood extent | Adjusted flood probability | Logistic Regression (not deep learning — small clean feature set, needs to stay explainable) | Historical flood extent + HAND baseline | Batch | Coefficients directly readable | IoU vs. historical extent | Poor performance on flash floods/urban drainage not captured by static DEM |

Everything else in the pipeline (multi-hazard combination, vulnerability index, priority score, site suitability, carrying capacity, allocation) is **explicitly not ML** — see §3 for why. This should be stated proudly in the demo, not hidden: "we used AI exactly where it earns its keep, and transparent methods everywhere a government official needs to defend the number."

---

## 13. Data strategy (verified, India-specific)

| Domain | Source | Resolution | Update freq | Access | Hackathon-suitable? |
|---|---|---|---|---|---|
| Terrain / DEM | CartoDEM (ISRO, via Bhuvan/Bhoonidhi) | 30m (2.5m stereo-derivable) | Static | Free download, registration | Yes |
| Terrain / DEM (fallback) | SRTM (NASA, via USGS EarthExplorer/OpenTopography) or Copernicus GLO-30 | 30m | Static | Free, no India-specific registration | Yes — recommended primary for hackathon speed |
| Landslide hazard | NRSC Landslide Atlas / Hazard Zonation maps, Bhuvan Disaster Services | 1:25,000 mapping, ~80,000-event inventory (1998–2022) | Periodic | Bhuvan web GIS; bulk API access requires request | Yes, for demo districts; **Assumption/TBV**: bulk programmatic export may need permission — plan a manual-download fallback |
| Rainfall (historical, gridded) | IMD 0.25°×0.25° daily gridded rainfall, 1901–present | ~25km grid | Daily (historical archive) | Free via IMD Pune / `IMDLIB` Python package | Yes |
| Rainfall (real-time/forecast) | IMD API gateway (`api.imd.gov.in`) | Station/gridded | Real-time | Requires registration/whitelisting | **Assumption/TBV** — for the demo, simulate with recorded historical extreme-rainfall events rather than waiting on live API approval |
| River levels / flood forecasts | CWC / India-WRIS National Water Data Portal (telemetry rainfall & river level), CWC Flood Forecast Dashboard | Station-level, hourly telemetry | Hourly | Open data portal (nwdp.nwic.gov.in) | Yes |
| Satellite imagery | Bhoonidhi (ISRO archive: Cartosat, Resourcesat, Sentinel-1/2, Landsat-8/9 regional distribution) | 2.5m–30m depending on sensor | Revisit-dependent | Free/registration; Bhoonidhi API available on request | Partial — use Sentinel Hub / Copernicus directly as a faster hackathon path for Sentinel-1/2 |
| Land cover / NDVI | Bhuvan LULC thematic layers | 30–56m | Periodic | Free | Yes |
| Population / demographics / amenities | Census 2011 Village Directory & Primary Census Abstract (data.gov.in), also structured as the open **SHRUG** dataset | Village-level | **Static, last full count 2011** | Free, open | Yes — but flag prominently as **Assumption/TBV: stale by up to 15 years**; note this is a known, real limitation of any India village-level system today, not a gap unique to this prototype |
| Roads / health / schools (current) | OpenStreetMap (roads, health facilities, schools POIs) | Variable, crowd-updated | Continuous | Free, open | Yes — good complement to stale Census infra fields |
| Administrative boundaries | Survey of India / Bhuvan admin layers, or `datameet` community shapefiles | District/Tehsil/Village | Static | Free (community layers) / licensed (SoI) | Yes, via community shapefiles for hackathon |
| Geology / soil | GSI Bhukosh portal | Variable | Static | Free/registration | Partial — good stretch goal, not MVP-blocking |

No dataset or API above is invented; each is a real, named, publicly documented source. Where programmatic/bulk access is uncertain (IMD real-time API, Bhoonidhi bulk API, NRSC landslide inventory bulk export), this is flagged as **Assumption / To Be Validated**, with a manual-download or historical-replay fallback baked into the MVP plan so the demo doesn't depend on approvals that may not arrive in time.

---

## 14. Hackathon MVP scope

**Must have**: one real demo district (or synthetic-but-realistic equivalent) → DEM-derived terrain hazard + rainfall-based flood/landslide scoring → composite risk index → vulnerability index from Census data → relocation priority ranking with visible breakdown → candidate safe sites with suitability scores → carrying-capacity calculation with bottleneck shown → MIP-based village→site allocation → map + side-panel UI → the full loop demonstrably connected end to end.

**Should have**: simulated real-time rainfall injection that re-triggers the pipeline live; route planning between village and assigned site; SHAP/feature-importance view for the ML susceptibility model; exportable PDF recommendation report per village.

**Could have**: satellite change-detection layer (encroachment/erosion over time); multi-district scaling; role-based login (State vs District view); GSI soil layer integration.

**Do not build**: agent-based population-movement simulation, a full digital twin, GNN-based hazard modelling, live production integration with IMD/CWC APIs (use historical replay instead), a fully custom auth/RBAC system (mock it), a mobile app.

---

## 15. Demo scenario

District with a real or realistic mix of landslide-prone hill villages and flood-prone riverine villages. Judge sees: (1) baseline dashboard with current red-zone map and ranked priority list; (2) presenter injects a historical extreme-rainfall event; (3) hazard layers visibly update, 2–3 villages jump tiers with an on-screen alert; (4) presenter clicks the top village → side panel shows full explainable breakdown; (5) presenter clicks "Find relocation plan" → optimizer runs live, shows assignment to a specific site with capacity bottleneck displayed and route drawn; (6) presenter shows the "why" panel and the human-approval step (Approve / Override / Request more data) to make clear this is decision *support*, not decision *automation*.

---

## 16–19. Architecture, database, roles, UX

See the PRD (`02-PRD.md`) for the Mermaid architecture diagram, ER diagram, role-by-role workflows, and full UI specification — these are implementation detail derived directly from the decisions above, not additional strategy.

---

## 20. Explainability

Every score in the system is a named, weighted sum of inspectable sub-scores (§5–9) — this is a deliberate architectural choice, not a UI afterthought, precisely so that explainability doesn't require post-hoc tools. Where genuine ML is used (landslide susceptibility, §12), feature importances (and SHAP values as a stretch goal) are surfaced alongside the score. Every recommendation carries a confidence indicator tied to underlying data freshness/completeness (e.g., "Census data is 14 years old" shown as a caveat, not hidden).

---

## 21. Validation

| Component | Metric | Hackathon-feasible validation without perfect data |
|---|---|---|
| Hazard classification | Precision/Recall/F1/AUC vs. known landslide inventory | Hold out a subset of NRSC's known landslide points as test set |
| Flood extent | IoU vs. historical flood extent | Compare HAND-derived extent to a documented historical flood event's mapped extent |
| Risk/priority ranking | Face validity + rank correlation vs. domain-expert manual ranking on a small sample | Ask a mentor/domain-adjacent judge to manually rank 5 villages, compare rank order |
| Site suitability | Sensitivity analysis (does ranking survive ±10% weight perturbation) | Run weight-perturbation programmatically, show stability |
| Carrying capacity | Sanity bounds vs. published rural planning norms (persons/ha, Lpcd) | Compare against standard Indian rural planning density norms |
| Optimization | Optimality gap, constraint satisfaction | Solver reports proven-optimal or gap %, trivially checkable |

---

## 22. Failure modes & safety

Explicit design responses: every recommendation carries a **confidence score** and **data-freshness indicator**; every relocation recommendation requires **human approval** before any downstream action; a **manual override** field is always available with mandatory justification text (creates an audit trail); **model/version metadata** is attached to every score so a later dispute can trace exactly which data vintage produced it; **uncertainty is visualized**, not just the point estimate — e.g. a hazard score shown as a range/confidence band, not a bare number, where the underlying model provides one. The platform is explicitly framed, in the UI itself, as a **decision-support system**, never an autonomous authority.

---

## 23. Security & governance (proportional)

Hackathon MVP: mocked role-based login (State/District/Analyst), audit log of who viewed/approved/overrode what, no real PII beyond village-aggregate Census data (no individual-level data at all — this sidesteps most privacy concerns by design). Production trajectory (documented, not built): proper RBAC via govt SSO, encrypted data at rest/in transit, formal data-sharing agreements with NRSC/IMD/CWC, model versioning and drift monitoring, backup/DR per government cloud (MeghRaj/NIC) standards.

---

## 24. Competitive differentiation

1. **Carrying-capacity-aware allocation, not just site suggestion** — most hazard-dashboard projects stop at "here are safe zones"; this one proves a site can actually absorb the population before recommending it, with the binding constraint named.
2. **An actual optimization step**, not a nearest-safe-site heuristic — a genuinely hard combinatorial problem solved provably-optimally, which is real technical substance a judge can be shown and verify.
3. **Deliberately restrained AI use, made explicit** — most hackathon entries over-claim AI; stating plainly "ML only where it beats deterministic methods" is unusual, defensible, and reads as engineering maturity to a technical judge panel.
4. **Formula-level explainability baked into the architecture**, not bolted on via SHAP after the fact — a District official can trace every number by construction.
5. **Live dynamic re-scoring demo** (inject a rainfall event, watch the whole downstream pipeline recompute) — directly and visibly answers the brief's "dynamically identifies and updates" requirement, which most weighted-overlay-map submissions will not demonstrate live.

---

## 25. Judge perspective

| Criterion | Score /10 | Note |
|---|---|---|
| Problem relevance | 9 | Directly and fully addresses the stated problem |
| Innovation | 7 | Carrying-capacity + optimization stage is the genuine differentiator; hazard mapping itself is not novel |
| Technical sophistication | 8 | Real ML + real OR, correctly scoped |
| Feasibility | 8 | All chosen methods are hackathon-buildable in the given time |
| AI usage | 6 | Deliberately restrained — a risk with judges who reward AI-maximalism (see rejection risk #1 below) |
| GIS sophistication | 8 | Full raster/vector pipeline with real Indian data sources |
| Social impact | 9 | Directly reduces disaster deaths/displacement harm |
| Government applicability | 9 | Explainability and human-in-loop design map directly onto real institutional requirements |
| Scalability | 7 | Pipeline design scales; hackathon demo will be single-district |
| Demo wow factor | 7 | Live re-trigger + optimizer run is strong if executed cleanly |
| Explainability | 9 | Architected in, not bolted on |
| Differentiation | 8 | Genuine, not just narrative |

**Top 5 reasons judges might reject this, and the mitigation already built in:**

1. *"Where's the AI? This looks like a GIS dashboard."* → Mitigation: lead the demo with the ML susceptibility model and its feature importances, and say out loud why the rest is deliberately not ML (§3) — reframe restraint as a strength, not an absence.
2. *"This data is fake/synthetic."* → Mitigation: use real, named, cited public datasets (§13) wherever feasible for at least one real district; label anything genuinely synthetic clearly in the demo instead of hiding it.
3. *"Carrying capacity numbers look made up."* → Mitigation: show the bottleneck breakdown (§9) live — a judge can check the arithmetic themselves, which builds more trust than a black-box number.
4. *"What happens when there's no good site nearby?"* → Mitigation: the optimizer must have a defined behavior for infeasibility (flag "no site within capacity/distance bounds — escalate to State level" rather than silently failing or forcing a bad match) — build and demo this edge case explicitly, it's a strong trust signal.
5. *"This could just automate bad decisions faster."* → Mitigation: the human-approval/override step is not a footnote — put it on screen during the live demo as an explicit, visible click, not just mentioned in the PRD.

---

## 26. Challenging our own assumptions

- **Is "Red Zone" legally/scientifically definable?** Only as a probabilistic, banded classification with named methodology — never claim legal force; the platform explicitly outputs a *recommendation*, and the PRD requires a disclaimer that final red-zone notification is a state government legal act, not a system output.
- **Can AI reliably classify permanent-habitation suitability?** No — that's precisely why suitability and priority are deterministic formulas, not model predictions (§3); ML is confined to the one sub-problem (terrain susceptibility) where it has real signal and a real label source.
- **How is uncertainty represented?** Confidence bands and data-freshness flags on every score (§22), not point estimates alone.
- **Can carrying capacity really be inferred from available data?** Only approximately, and it should be labelled as a planning estimate requiring field verification before any real relocation, not a guarantee — stated explicitly in the UI and PRD non-functional requirements.
- **How do we handle incomplete population data?** Census 2011 is stale; the design flags data age visibly and treats population figures as an input to be corrected by local officials, not an immutable ground truth (an "official correction" field is part of the schema).
- **Evacuation vs. permanent relocation?** These are different decisions with different urgency and reversibility; the system's "Immediate" tier is scoped to mean *"flag for evacuation planning and expedited permanent-relocation assessment,"* not "auto-trigger evacuation" — the platform does not claim evacuation-authority.
- **What if the nearest safe site lacks capacity?** The optimizer either assigns to the next-best feasible site (higher cost) or returns infeasible with an explicit escalation flag — never silently drops population.
- **What if every nearby site has some risk?** Suitability is comparative and threshold-gated, not "must be zero risk" — the system surfaces the least-risk feasible option with its residual risk stated, rather than failing to recommend anything.
- **Should one extreme hazard override all others?** Yes — this is exactly why §5 uses a max-rule floor, not a pure average, so one catastrophic hazard can't be diluted away by benign scores on other hazards.
- **Could the system recommend environmentally/socially harmful relocation?** Hard exclusion filters (protected areas, eco-sensitive zones, occupied land — §8) prevent the optimizer from ever proposing these sites at all, rather than penalizing them softly.
- **How do we stop officials from treating outputs as absolute truth?** Every output is explicitly labelled a recommendation, requires a logged human approval/override, and the UI persistently shows data-vintage and confidence — this is a design requirement, carried into the PRD's non-functional requirements, not just a disclaimer in a slide.
