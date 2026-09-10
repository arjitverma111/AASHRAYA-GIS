"""
In-Memory Data Store & State Manager
Loads seed datasets, runs initial assessments, and manages runtime state
for habitations, candidate sites, active simulation, allocations, and audit logs.
"""
import json
import copy
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import DATA_DIR, PLANNING_NORMS
from app.engines.hazard_engine import compute_hazard_suite
from app.engines.vulnerability_engine import compute_vulnerability_index
from app.engines.risk_engine import compute_composite_risk
from app.engines.capacity_engine import evaluate_site_carrying_capacity
from app.engines.relocation_engine import compute_relocation_priority, compute_haversine_distance

class DataStore:
    def __init__(self):
        self.raw_habitations: List[Dict[str, Any]] = []
        self.raw_sites: List[Dict[str, Any]] = []
        self.hazard_geojson: Dict[str, Any] = {}
        self.historical_disasters: List[Dict[str, Any]] = []

        # Current working state
        self.habitations: List[Dict[str, Any]] = []
        self.candidate_sites: List[Dict[str, Any]] = []
        self.active_alerts: List[Dict[str, Any]] = []
        self.audit_log: List[Dict[str, Any]] = []
        self.last_optimization_result: Optional[Dict[str, Any]] = None
        self.simulation_state: Dict[str, Any] = {
            "is_active": False,
            "injected_rainfall_mm": 0.0,
            "simulated_timestamp": None
        }

        self.load_and_initialize()

    def load_and_initialize(self):
        """Loads JSON/GeoJSON files and initializes assessment scores."""
        # 1. Load Habitations
        hab_path = DATA_DIR / "habitations.json"
        with open(hab_path, "r", encoding="utf-8") as f:
            self.raw_habitations = json.load(f)

        # 2. Load Candidate Sites
        sites_path = DATA_DIR / "candidate_sites.json"
        with open(sites_path, "r", encoding="utf-8") as f:
            self.raw_sites = json.load(f)

        # 3. Load Hazard Polygons
        hz_path = DATA_DIR / "hazard_zones.geojson"
        with open(hz_path, "r", encoding="utf-8") as f:
            self.hazard_geojson = json.load(f)

        # 4. Load Historical Disasters
        hd_path = DATA_DIR / "historical_disasters.json"
        with open(hd_path, "r", encoding="utf-8") as f:
            self.historical_disasters = json.load(f)

        self.reset_to_baseline()

    def reset_to_baseline(self):
        """Resets all working state to baseline pre-monsoon conditions."""
        self.habitations = copy.deepcopy(self.raw_habitations)
        self.candidate_sites = copy.deepcopy(self.raw_sites)
        self.active_alerts = []
        self.simulation_state = {
            "is_active": False,
            "injected_rainfall_mm": 0.0,
            "simulated_timestamp": None
        }

        # Initialize Candidate Sites Carrying Capacity
        for site in self.candidate_sites:
            cap_eval = evaluate_site_carrying_capacity(site)
            site.update(cap_eval)

        # Filter valid sites for distance checking
        valid_sites = [s for s in self.candidate_sites if not s.get("is_inside_hazard_zone", False)]

        # Initialize Habitations Assessments
        for h in self.habitations:
            # 1. Hazards
            hazards, hazard_meta = compute_hazard_suite(h, rainfall_override=h.get("baseline_rainfall_24h_mm", 80.0))
            h["hazards"] = hazards

            # 2. Vulnerability
            v_idx, v_breakdown = compute_vulnerability_index(
                demographics=h.get("demographics", {}),
                infra_distances=h.get("infrastructure_distances_km", {})
            )
            h["vulnerability"] = {
                "vulnerability_index": v_idx,
                "factors": v_breakdown
            }

            # 3. Risk
            risk_data, risk_band = compute_composite_risk(
                hazard_index=hazards["composite_hazard_index"],
                landslide_score=hazards["landslide_score"],
                flood_score=hazards["flood_score"],
                cloudburst_score=hazards["cloudburst_score"],
                population=h["population"],
                vulnerability_index=v_idx,
                historical_disasters=h.get("historical_disasters_10y", 1),
                panchayat=h.get("panchayat", ""),
                village_name=h["name"]
            )
            h["risk"] = risk_data

            # 4. Nearest safe site distance
            min_dist = 14.0
            if valid_sites:
                distances = [
                    compute_haversine_distance(h["latitude"], h["longitude"], s["latitude"], s["longitude"])
                    for s in valid_sites
                ]
                min_dist = min(distances) if distances else 14.0

            # 5. Relocation Priority
            priority_data, tier = compute_relocation_priority(
                hazard_index=hazards["composite_hazard_index"],
                landslide_score=hazards["landslide_score"],
                flood_score=hazards["flood_score"],
                cloudburst_score=hazards["cloudburst_score"],
                vulnerability_index=v_idx,
                population=h["population"],
                historical_disasters=h.get("historical_disasters_10y", 1),
                nearest_safe_site_distance_km=min_dist
            )
            h["priority"] = priority_data
            h["approval_status"] = "PENDING_REVIEW"
            h["assigned_site_id"] = None

        # Seed initial baseline operational alerts
        now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        critical_villages = [h for h in self.habitations if h["priority"]["priority_tier"] == "IMMEDIATE"]
        for cv in critical_villages:
            self.active_alerts.append({
                "id": f"ALT_BASE_{cv['id']}",
                "timestamp": now_iso,
                "severity": "CRITICAL",
                "habitation_id": cv["id"],
                "habitation_name": cv["name"],
                "panchayat": cv["panchayat"],
                "message": f"Pre-monsoon assessment flags {cv['name']} ({cv['panchayat']}) as IMMEDIATE priority based on high terrain slope and historical debris failures.",
                "action_required": "Review designated relocation sites and verify PHC/Water capacity."
            })

    def get_habitation_by_id(self, hab_id: str) -> Optional[Dict[str, Any]]:
        for h in self.habitations:
            if h["id"] == hab_id:
                return h
        return None

    def get_site_by_id(self, site_id: str) -> Optional[Dict[str, Any]]:
        for s in self.candidate_sites:
            if s["id"] == site_id:
                return s
        return None

    def add_audit_log(self, entry: Dict[str, Any]):
        self.audit_log.insert(0, entry)

# Global singleton
db = DataStore()
