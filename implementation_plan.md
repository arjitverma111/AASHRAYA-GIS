# Implementation Plan: AASHRAYA-GIS Command Center

**Problem Statement 26191 (NDRF / Ministry of Home Affairs):**  
"Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations"

We are building a production-grade, highly polished **National Disaster Decision-Support Command Center** for State and District Disaster Management Authorities. The system answers the 8 critical questions an official needs before signing a relocation order:
1. *Is this habitation at risk, and from which hazard(s)?*
2. *How severe and how confident?*
3. *How many people and how vulnerable?*
4. *How urgent (Immediate / Short-term / Medium-term / Monitor)?*
5. *Where could they go, and is that candidate site truly safe?*
6. *Can that site physically absorb them (carrying capacity bottleneck)?*
7. *What is the optimal village-to-site assignment minimizing distance and disruption?*
8. *What is the auditable evidence trail behind every number?*

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions for Review:**
> 1. **Modular Monolith Architecture:** Backend runs as a high-speed asynchronous FastAPI service in Python 3.14, and frontend runs as a Vite + React 19 + TypeScript + Tailwind CSS application.
> 2. **Deterministic & MILP Optimization:** Optimization uses Mixed-Integer Linear Programming (PuLP / CBC solver) guaranteeing mathematical optimality and verifiable constraint adherence, with an explicit "Escalate - Infeasible" branch.
> 3. **Offline Resilience & Data Integrity:** For reliable presentation during demo evaluations, all spatial layers (Wayand, Kerala - Chooralmala, Meppadi, Puthumala, Chaliyar Basin) are pre-computed and stored locally in GeoJSON/JSON, eliminating runtime dependency on slow or authenticated external government APIs.
> 4. **Live Dynamic Simulation:** A dedicated "Simulate Heavy Rainfall" capability recalculates all hazard scores, risks, relocation priority tiers, and triggers real-time alerts without page reload.

---

## Proposed Changes

The implementation is structured into clean components:

### 1. Data Foundation & Seed Data (`/data`)

#### [NEW] `data/habitations.json`
- 24 real villages across Wayanad district (Meppadi, Vythiri, Mananthavady, Sulthan Bathery).
- Granular Census 2011 demographics (elderly, children, disabled, kutcha housing, BPL).
- Infrastructure distances (hospitals, all-weather roads, fire/police).
- Physical terrain metrics (SRTM 30m derived slope, elevation, HAND, TWI).

#### [NEW] `data/candidate_sites.json`
- 6 candidate relocation sites outside hazard red zones.
- Detailed capacities (usable land area, water yield LPCD, electrical substation headroom, PHC capacity, school capacity).
- Environmental and safety scores.

#### [NEW] `data/hazard_zones.geojson`
- Geographically coherent red zone polygons for landslide scarps, flood plains, and multi-hazard composites.

---

### 2. Backend Decision & Optimization Engines (`/backend/app/engines`)

#### [NEW] `hazard_engine.py` & `ml_susceptibility.py`
- Random Forest terrain susceptibility classifier with inspectable feature importances.
- Hydrological HAND-based flood susceptibility and extreme rainfall thresholds.

#### [NEW] `vulnerability_engine.py`
- Transparent, weighted vulnerability index calculated from census proxies and infrastructure access.

#### [NEW] `risk_engine.py`
- Max-rule-plus-residual composite multi-hazard risk formulation:
  $$\text{HazardIndex} = \min(1.0, \max(w_i H_i) + 0.15 \sum \text{residuals})$$
  $$\text{CompositeRisk} = 0.40 \text{Hazard} + 0.25 \text{Exposure} + 0.20 \text{Vulnerability} + 0.15 \text{History}$$
- Banding into Red Zone, Orange, Watch, and Green.

#### [NEW] `capacity_engine.py`
- True bottleneck carrying capacity with 0.85 safety margin:
  $$\text{EffectiveCapacity} = \lfloor \min(\text{Land}, \text{Water}, \text{Power}, \text{Health}, \text{School}) \times 0.85 \rfloor$$
- Identifies and labels the exact binding constraint.

#### [NEW] `optimization_engine.py`
- PuLP-based Mixed-Integer Linear Programming solver optimizing village-to-site assignments minimizing distance and risk subject to capacity constraints. Includes infeasibility escalation flag.

#### [NEW] `simulation_engine.py`
- Dynamic re-scoring on simulated heavy rainfall events (+50mm to +250mm).

---

### 3. Backend REST APIs (`/backend/app/routes`)

#### [NEW] `main.py`, `config.py`, `models/schemas.py`, `data/data_store.py`
- Modular FastAPI endpoints:
  - `GET /api/dashboard`: Summary stats, alerts, risk distribution.
  - `GET /api/habitations`: All habitations with scores and geometry.
  - `GET /api/habitations/{id}`: Deep dive with plain-language factor breakdown.
  - `GET /api/hazards/layers`: GeoJSON hazard polygons.
  - `GET /api/relocation/sites`: Relocation candidate sites with bottleneck stats.
  - `POST /api/relocation/optimize`: Run MILP allocation.
  - `POST /api/relocation/approve`: Log human approval / override to audit trail.
  - `POST /api/simulation/heavy-rainfall`: Trigger dynamic rainfall recomputation.
  - `POST /api/simulation/reset`: Reset to baseline.
  - `GET /api/analytics`: Spatial and demographic risk analytics.
  - `GET /api/audit/logs`: Immutable audit log of administrative decisions.

---

### 4. Frontend Command Center UI (`/frontend`)

#### [NEW] React 19 + Vite + TypeScript + Tailwind Application
- **`Navbar.tsx` & `SystemStatus.tsx`:** Operational status indicators (GIS Engine, Risk Engine, Optimizer, Hazard Feed) and persona switcher (State DMA, District DMA, GIS Analyst).
- **`DashboardPage.tsx`:** 8 high-level command metrics, urgency priority breakdown, live alert ticker, and high-risk village table.
- **`MapComponent.tsx`:** Leaflet GIS map with multi-hazard polygon toggle, color-coded habitation pins (pulsing Red Zone badges), candidate sites, and allocation route lines.
- **`HabitationDetailDrawer.tsx`:** Explainable side panel showing demographic radar, hazard gauges, formula breakdown ("Why this rank?"), and human approval controls.
- **`RelocationPlanner.tsx`:** Interactive allocation board displaying village queues, candidate site capacity gauges with binding bottleneck tags, and one-click MILP solver execution.
- **`AnalyticsPage.tsx`:** Recharts data visualizations for risk distribution, capacity headroom, and demographic vulnerability.
- **`MethodologyPage.tsx`:** Complete, transparent formulas, Indian planning standards, and data provenance notices.
- **`RainfallSimulatorModal.tsx`:** Interactive slider to inject heavy rainfall and observe live recalculation across the entire platform.

---

### 5. Documentation & Demo Artifacts (`/docs`)

- `REQUIREMENTS_TRACEABILITY.md` (Already created)
- `IMPLEMENTATION_PLAN.md` (Already created)
- `TECHNICAL_ARCHITECTURE.md` (Architecture diagrams & data flow)
- `DEMO_SCRIPT.md` (3-minute step-by-step judge presentation script)
- `README.md` (Quickstart, architecture, offline setup instructions)

---

## Verification Plan

### Automated Backend Tests
- `pytest backend/tests/test_risk_engine.py`: Test max-rule composite formulation, residual weights, and tier classification.
- `pytest backend/tests/test_vulnerability_engine.py`: Test census indicator weights and normalization.
- `pytest backend/tests/test_capacity_engine.py`: Test carrying capacity bottleneck identification and safety margin application.
- `pytest backend/tests/test_optimization_engine.py`: Test MILP solver assignment optimality, capacity bounding, and infeasibility detection.
- `pytest backend/tests/test_simulation.py`: Test live rainfall event injection and tier re-computation.
- `pytest backend/tests/test_api.py`: Comprehensive test covering all FastAPI endpoints.

### End-to-End Manual Verification (3-Minute Judge Flow)
1. Launch backend on `localhost:8000` and frontend on `localhost:5173`.
2. Verify Command Center Dashboard displays total habitations, population exposed, and active alerts.
3. Open Interactive GIS Map, toggle Landslide and Flood Red Zones, click **Chooralmala** (or top critical village).
4. Inspect Habitation Drawer: verify plain-language explanation and formula contribution percentages.
5. Open Relocation Planner: inspect candidate sites, note the binding bottleneck (e.g. Water constraint).
6. Click "Generate Relocation Plan" (MILP): confirm provably optimal assignment and route rendering.
7. Click "Simulate Heavy Rainfall" (+180mm): watch risk levels surge, new villages enter Immediate tier, and alerts trigger live.
8. Approve relocation recommendation with an administrative note; verify entry appears in Audit Log.
