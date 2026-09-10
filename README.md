# AASHRAYA-GIS Command Center
### Intelligent Multi-Hazard Red-Zone Identification, Carrying-Capacity Assessment & Immediate Relocation Decision-Support Platform

**Problem Statement ID:** 26191  
**Organization:** Ministry of Home Affairs, Government of India  
**Department:** National Disaster Response Force (NDRF), Disaster Management Division  
**Theme:** Disaster Management (Software Edition)  
**Demo Scope:** Wayanad District, Western Ghats, Kerala  

---

## 1. Executive Summary

India's disaster-prone regions face recurring landslides, flash floods, and cloudbursts. Conventional disaster management remains largely reactive, with evacuations initiated post-disaster under chaotic conditions. Moreover, existing hazard maps fail to answer the operational questions a District Magistrate or State DMA official must answer before signing a relocation order:
- *Which specific habitations must be relocated first?*
- *Why this village over an adjacent one (formula-level explainability)?*
- *Where can they go, and is that candidate site truly safe from secondary hazards?*
- *Can the candidate site physically absorb them (water, power, land, hospital, and school carrying capacity)?*
- *What is the provably optimal village-to-site assignment that minimizes travel distance and social disruption?*
- *How does the plan automatically adapt when rainfall conditions surge?*

**AASHRAYA-GIS** is a production-grade, highly polished National Disaster Command Center platform that solves this multi-hazard decision loop from end to end.

---

## 2. Key Capabilities & "WOW" Differentiators

1. **Explainable Multi-Hazard Susceptibility (ML + Hydrology):**
   - Combines a **Scikit-Learn Random Forest Classifier (100 Trees)** trained on physical terrain covariates (slope, elevation, TWI, road cut proximity, rainfall) with **HAND (Height Above Nearest Drainage)** hydrological flood modeling.
   - Uses the non-diluting **Max-Rule-Plus-Residual** formula ($H_{\text{composite}} = \max(w_i H_i) + 0.15 \sum \text{residuals}$) so a catastrophic landslide score is never washed out by a zero flood score.
   - Surfaces an inspectable **Score Contribution Waterfall** and plain-language explanation for every village.

2. **Multi-Dimensional Bottleneck Carrying Capacity:**
   - Evaluates candidate relocation sites across 5 independent infrastructure dimensions:
     - **Land Capacity:** $125\text{ persons/ha}$ (URDPFI rural density norm)
     - **Water Supply Headroom:** $100\text{ LPCD}$ (Jal Jeevan Mission / CPHEEO norm)
     - **Power Substation Feeder Headroom:** $0.5\text{ kW/household}$
     - **Healthcare Capacity:** PHC design headroom ($30,000\text{ pop/PHC}$)
     - **School Headroom:** $40\text{ students/classroom}$ (RTE norm)
   - Identifies the exact **Binding Bottleneck** and applies a statutory **15% safety buffer** ($\eta = 0.85$).

3. **Provably Optimal Allocation Solver (PuLP MILP):**
   - Formulates the relocation assignment as a **Mixed-Integer Linear Program (MILP)** solved via the **Coin-or Branch and Cut (CBC)** solver.
   - Minimizes distance, residual risk, and livelihood disruption subject to hard capacity limits.
   - Features **Infeasibility Escalation Handling**: flags villages where regional capacity is exhausted with an explicit escalation recommendation to State DMA.

4. **Dynamic Real-Time Weather Simulation ("Simulate Heavy Rain"):**
   - Inject simulated severe precipitation (+50mm to +250mm).
   - Watch the platform dynamically recompute the Landslide ML model, flood basins, risk bands, and priority tiers without page reload, triggering live emergency command alerts.

5. **Human-in-the-Loop Governance & Audit Trail:**
   - DM officials can **Approve**, **Override with reason**, or **Request Data**.
   - All actions are logged into an append-only, immutable audit trail for legal defense, high court inquiries, and RTI compliance.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet (CartoDB DarkMatter base tiles), Recharts (data analytics), Lucide React (military command icons).
- **Backend:** Python 3.14, FastAPI (Asynchronous ASGI REST API), Pydantic v2.
- **Operations Research & Optimization:** PuLP (CBC Mixed-Integer Linear Programming Solver), Scipy.
- **Machine Learning & Spatial Science:** Scikit-Learn (Random Forest Susceptibility), NumPy, Pandas, Shapely (in-memory geospatial vector processing).
- **Data Persistence:** In-memory high-speed state store seeded from curated GeoJSON and JSON datasets.

---

## 4. Repository Structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── engines/
│   │   │   ├── ml_susceptibility.py     # Scikit-learn RF landslide classifier & feature importances
│   │   │   ├── hazard_engine.py         # HAND flood hydrology & max-rule combination
│   │   │   ├── vulnerability_engine.py  # Census demographic vulnerability weighting
│   │   │   ├── risk_engine.py           # UNDRR composite risk calculation & explainability
│   │   │   ├── capacity_engine.py       # 5-dimension bottleneck carrying capacity & buffer
│   │   │   ├── optimization_engine.py   # PuLP MILP solver & infeasibility handling
│   │   │   └── simulation_engine.py     # Dynamic weather recomputation & alert generation
│   │   ├── routes/
│   │   │   ├── dashboard.py             # GET /api/dashboard (KPIs, queue, alerts)
│   │   │   ├── habitations.py           # GET /api/habitations, GET /api/habitations/{id}
│   │   │   ├── hazards.py               # GET /api/hazards/layers (GeoJSON overlays)
│   │   │   ├── relocation.py            # Candidate sites & POST /api/relocation/optimize
│   │   │   ├── simulation.py            # POST /api/simulation/heavy-rainfall
│   │   │   ├── analytics.py             # GET /api/analytics (Recharts payloads)
│   │   │   └── audit.py                 # GET /api/audit/logs (Audit trail)
│   │   ├── data/
│   │   │   └── data_store.py            # In-memory singleton state manager
│   │   ├── models/
│   │   │   └── schemas.py               # Strict Pydantic models
│   │   ├── config.py                    # Indian planning norms & decision weights
│   │   └── main.py                      # FastAPI application & CORS setup
│   ├── tests/                           # 18 Pytest automated verification tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Command center header & role switcher
│   │   │   ├── SystemStatus.tsx         # Telemetry bar
│   │   │   ├── LiveAlertBanner.tsx      # Critical alert ticker
│   │   │   ├── MapComponent.tsx         # Interactive Leaflet GIS decision map
│   │   │   ├── HabitationDetailDrawer.tsx # Explainability waterfall & sign-off form
│   │   │   ├── CapacityBottleneckCard.tsx # 5D carrying capacity card
│   │   │   ├── RainfallSimulatorModal.tsx # Dynamic precipitation injector
│   │   │   └── AuditLogModal.tsx        # Decision audit log viewer
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx        # Command center status board
│   │   │   ├── MapPage.tsx              # Full-viewport GIS map
│   │   │   ├── RelocationPage.tsx       # MILP relocation planner
│   │   │   ├── AnalyticsPage.tsx        # Recharts spatial risk distributions
│   │   │   └── MethodologyPage.tsx      # Mathematical formulas & standards
│   │   ├── services/
│   │   │   └── api.ts                   # Fetch API service
│   │   ├── types/
│   │   │   └── index.ts                 # Full TypeScript interfaces
│   │   ├── App.tsx                      # Root application component
│   │   └── index.css                    # Tailwind & Leaflet styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── data/
│   ├── habitations.json                 # 24 Wayanad villages with census & DEM metrics
│   ├── candidate_sites.json             # 6 Candidate relocation sites (with 1 hard-excluded)
│   ├── hazard_zones.geojson             # Multi-hazard red zone polygons
│   └── historical_disasters.json        # 2024, 2019, 2018 historical event catalog
├── docs/
│   ├── REQUIREMENTS_TRACEABILITY.md     # Full RTM mapping problem statement to code
│   ├── IMPLEMENTATION_PLAN.md           # Engineering implementation architecture
│   ├── TECHNICAL_ARCHITECTURE.md        # Deep dive into algorithms and sequence diagrams
│   └── DEMO_SCRIPT.md                   # 3-minute judge presentation walkthrough
├── .env.example
└── README.md
```

---

## 5. Setup & Running Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm

### 1. Run the Backend API
In the repository root:
```powershell
# Set python path and start uvicorn
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will launch at `http://127.0.0.1:8000`.  
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`  
- Health check: `http://127.0.0.1:8000/health`

### 2. Run the Frontend Command Center
Open a second terminal window in the `frontend` directory:
```powershell
cd frontend
npm run dev
```
The React command center UI will launch at `http://localhost:5173`.

---

## 6. Running Automated Tests

A comprehensive 18-test test suite verifies all risk formulas, ML classifiers, capacity bottlenecks, MILP solver optimality, simulation triggers, and API endpoints:
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```
**Test Coverage Includes:**
- `test_risk_engine.py`: Max-rule combination, single-hazard red zone floor overrides, plain-language text generation.
- `test_capacity_engine.py`: Multi-factor bottleneck identification and 15% buffer calculation.
- `test_optimization_engine.py`: Exact PuLP MILP solver constraint satisfaction and infeasibility escalation.
- `test_simulation.py`: Dynamic rainfall injection and live tier escalation.
- `test_vulnerability_engine.py`: Census indicator weights and distance normalizations.
- `test_api.py`: Full REST API contract and status code verification across all routes.

---

## 7. 3-Minute Demonstration Flow

Follow the step-by-step presentation script in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md):
1. **Open Dashboard:** Note 24 habitations assessed and 4,950 people in Immediate tier.
2. **Inspect Chooralmala:** Click Chooralmala to show the **Score Contribution Waterfall** (Hazard 38%, Exposure 25%, Vulnerability 23%, History 14%) and plain-language explanation.
3. **Open Relocation Planner:** View candidate sites. Highlight **Kalpetta South** where water capacity (3,100) is the binding bottleneck despite 4,750 land capacity.
4. **Execute MILP Optimization:** Click **"Execute Optimal Allocation"** — in under 50ms, the MILP solver allocates villages to sites under capacity limits and plots route lines.
5. **Inject Heavy Rainfall:** Click **"Simulate Heavy Rain"** (+220mm) — watch habitations surge to Immediate tier live, triggering emergency command alerts without reloading.
6. **Log Human Approval:** Submit an administrative sign-off; view the result in the append-only **Audit Log**.

---

## 8. Data Provenance & Synthetic Disclaimer

> **Prototype / Synthetic Disclaimer:**  
> This prototype is calibrated for **Wayanad District, Kerala**. Village names, coordinates, and demographic structures are based on public **Census 2011 Village Directories / SHRUG data**. Physical elevations and slopes reflect **SRTM 30m DEM** terrain models. Rainfall events replay historical extreme downpours from **IMD gridded data** (July 2024 Chooralmala cloudburst & August 2019 Puthumala landslide). Candidate relocation site infrastructure capacities are modelled on statutory **Indian Planning Guidelines (URDPFI, Jal Jeevan Mission, RTE, and IPHS norms)**. The platform is designed as an evidence-based decision-support system; final gazetted relocation orders remain the statutory responsibility of State and District Disaster Management Authorities.
