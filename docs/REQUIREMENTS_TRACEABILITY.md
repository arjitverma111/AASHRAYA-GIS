# Requirements Traceability Matrix (RTM)

**Project:** Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations  
**Problem Statement ID:** 26191  
**Authority:** NDRF (Disaster Management Division), Ministry of Home Affairs, Government of India  
**Scope Classification:** Hackathon MVP vs. Production System  

---

## 1. Scope Categorization Summary

| Tier | Description | Included in MVP | Rationale / Mitigation |
|------|-------------|-----------------|------------------------|
| **A. MUST BUILD FOR MVP** | Core end-to-end decision pipeline: Hazard -> Vulnerability -> Risk -> Relocation Priority -> Site Suitability -> Carrying Capacity Bottleneck -> MILP Optimization -> Explainability -> Live Event Re-computation. | **YES** | Solves the core decision-allocation challenge; answers "who, why, where, and how many". |
| **B. SHOULD BUILD** | Interactive GIS layer toggling, human-in-the-loop audit log (Approve/Override), role-based view switching (State/District/Analyst), live alert notifications on tier escalation, exportable summary table. | **YES** | Proves government operational viability and institutional trust. |
| **C. FUTURE / PRODUCTION** | Live IMD/CWC API socket ingest, Bhuvan/Bhoonidhi bulk satellite ETL, full government Single Sign-On (SSO/Parichay), OSRM turn-by-turn routing with dynamic road blockage, continuous model retraining. | **NO (Documented)** | Blocked by API credentials, network latency, and multi-week government approvals. Replaced with historical extreme-rainfall replay & haversine distance. |
| **D. CONCEPTUAL / NON-IMPLEMENTABLE** | Agent-based behavioral social-network evacuation simulation, automated unverified drone dispatch, direct eminent-domain land gazetting. | **NO** | Ethically and operationally outside the scope of an automated decision-support engine. |

---

## 2. Detailed Traceability Mapping

| PS Req # | Problem Statement Requirement | PRD Req # | Feature / Capability | Category | Backend Component | Frontend Component | Verification & Test |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **PS-01** | Identify multi-hazard Red Zones dynamically | **FR-1, FR-2, FR-4, FR-5** | Multi-hazard susceptibility scoring (Landslide, Flood, Cloudburst) with max-rule-plus-residual composite index & banded classification (Green, Watch, Orange, Red) | MUST | `hazard_engine.py`, `ml_susceptibility.py`, `risk_engine.py` | `MapComponent.tsx` (Red Zone polygons & points), `LayerControl.tsx` | `test_risk_engine.py::test_max_rule_composite_index`, `test_risk_engine.py::test_red_zone_banding` |
| **PS-02** | Machine Learning hazard susceptibility | **FR-1** | Random Forest / Scikit-learn classifier for terrain landslide susceptibility using slope, aspect, elevation, TWI, and rainfall with feature importances | MUST | `ml_susceptibility.py` | `HabitationDetailDrawer.tsx` (Top contributing terrain features & weights) | `test_ml_susceptibility.py::test_classifier_inference_and_feature_importances` |
| **PS-03** | Population vulnerability assessment | **FR-6, FR-7** | Transparent, weighted Vulnerability Index from demographic census indicators (elderly, children, disabled, kutcha housing, hospital distance, road distance) | MUST | `vulnerability_engine.py` | `HabitationDetailDrawer.tsx` (Vulnerability breakdown chart), `VulnerabilityBadge.tsx` | `test_vulnerability_engine.py::test_vulnerability_score_calculation` |
| **PS-04** | Distinct reporting of Hazard, Exposure, Vulnerability, and Risk | **FR-7** | Separate metric display adhering to UNDRR framework: $Risk = f(Hazard, Exposure, Vulnerability)$ | MUST | `risk_engine.py`, `schemas.py` | `MetricOverview.tsx`, `HabitationDetailDrawer.tsx` | `test_risk_engine.py::test_separate_components` |
| **PS-05** | Relocation prioritization of vulnerable habitations | **FR-8, FR-9** | Formula-driven Priority Ranking with 4 action tiers: `Immediate (>0.75 or hazard >= 0.9)`, `Short-term (0.5-0.75)`, `Medium-term (0.3-0.5)`, `Monitor (<0.3)` | MUST | `relocation_engine.py` | `PriorityBadge.tsx`, `DashboardPage.tsx` (Priority Queue Table) | `test_relocation_engine.py::test_priority_tiers` |
| **PS-06** | Identify suitable relocation candidate sites | **FR-10, FR-11** | GIS exclusion of hazard red zones and eco-sensitive land; multi-criteria suitability scoring (safety, infrastructure, proximity) | MUST | `relocation_engine.py`, `data_store.py` | `RelocationPlanner.tsx` (Candidate site cards & map markers) | `test_relocation_engine.py::test_hard_exclusion_filtering`, `test_relocation_engine.py::test_site_suitability` |
| **PS-07** | Carrying capacity assessment of candidate sites | **FR-12, FR-13** | Multi-dimensional bottleneck capacity evaluation: $\min(\text{Land}, \text{Water}, \text{Power}, \text{Health}, \text{School}) \times \text{SafetyMargin}$ | MUST | `capacity_engine.py` | `CapacityBottleneckCard.tsx` (Limiting constraint gauge & progress bars) | `test_capacity_engine.py::test_bottleneck_identification` |
| **PS-08** | Optimized relocation assignment | **FR-14, FR-15, FR-16** | Mixed-Integer Linear Programming (MILP / PuLP) solver for cost minimization under hard capacity limits; handles infeasibility with escalation flag | MUST | `optimization_engine.py` | `RelocationPlanner.tsx` (Allocation matrix & flow visualization) | `test_optimization_engine.py::test_milp_solver_optimality_and_infeasibility` |
| **PS-09** | Formula-level explainability ("Why this recommendation?") | **FR-9, FR-17, NFR-2** | Plain-language factor breakdown waterfall showing exact % weights, raw values, and binding bottlenecks | MUST | `risk_engine.py`, `capacity_engine.py`, `optimization_engine.py` | `HabitationDetailDrawer.tsx` ("Why Ranked #X" breakdown), `ExplainabilityModal.tsx` | `test_risk_engine.py::test_explanation_generation` |
| **PS-10** | Dynamic / Real-time hazard simulation | **FR-21, FR-22** | "Simulate Heavy Rainfall" trigger recomputing hazards, risks, priorities, and alerts on the fly without page reload | MUST | `simulation_engine.py`, `routes/simulation.py` | `RainfallSimulatorModal.tsx`, `LiveAlertBanner.tsx` | `test_simulation.py::test_rainfall_event_recomputation` |
| **PS-11** | Human-in-the-loop Governance & Audit Trail | **FR-18, FR-19** | Action logging: Approve, Override (with mandatory reason), or Request Data; persistent audit log | SHOULD | `routes/audit.py`, `data_store.py` | `AuditLogModal.tsx`, `HumanApprovalControls.tsx` | `test_api.py::test_audit_trail_logging` |
| **PS-12** | Role-based Command Center Views | **FR-20** | Persona views: State DMA (macro-allocations), District DMA (operational prioritization), GIS Analyst (data quality & weights) | SHOULD | `main.py` | `RoleSelector.tsx`, `Navbar.tsx` | `test_api.py::test_role_filtered_endpoints` |
| **PS-13** | Command Center Analytics & Trend Visualization | **PRD §18** | Visual breakdowns of population exposed, hazard composition, capacity headroom, and district distribution | MUST | `routes/analytics.py` | `AnalyticsPage.tsx` (Recharts diagrams) | `test_api.py::test_analytics_payload` |
| **PS-14** | Complete Methodology Documentation | **PRD §19** | Interactive documentation of all mathematical formulas, norms, thresholds, and data provenances | MUST | N/A (Static verified definitions) | `MethodologyPage.tsx` (Formula reference & parameter table) | UI manual test & verification |

---

## 3. Verification & Compliance Matrix

| Component | Coverage Target | Automated Test Suite | Manual Verification Step |
|-----------|-----------------|----------------------|--------------------------|
| Hazard & Risk Engine | 100% Core Logic | `pytest backend/tests/test_risk_engine.py` | Select village with >150mm rainfall; confirm Red zone tag |
| ML Susceptibility | Model Inference & Weights | `pytest backend/tests/test_ml_susceptibility.py` | Verify feature importance bar chart displays slope as top factor |
| Vulnerability Engine | 100% Score Bounds [0, 1] | `pytest backend/tests/test_vulnerability_engine.py` | Validate high kutcha % + low healthcare raises score |
| Capacity Engine | 100% Bottleneck Logic | `pytest backend/tests/test_capacity_engine.py` | Validate site with 5000 land capacity but 1200 water capacity caps at 1020 (85% margin) |
| Relocation Optimizer | Optimality & Infeasibility | `pytest backend/tests/test_optimization_engine.py` | Run assignment; verify total assigned $\le$ available capacity |
| Dynamic Simulation | State Recalculation Loop | `pytest backend/tests/test_simulation.py` | Click "Inject 200mm Rainfall"; check 2+ villages escalate to Immediate |
| End-to-End API | All REST Endpoints | `pytest backend/tests/test_api.py` | Start FastAPI; execute curl/HTTP tests against all endpoints |
