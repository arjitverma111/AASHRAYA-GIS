"""
Simulation Engine
Handles dynamic real-time hazard simulation (e.g. Extreme Monsoon Rainfall Injection)
and automated critical alert generation (PRD §11, FR-21, FR-22).
"""
import datetime
from typing import List, Dict, Any, Tuple
from app.engines.hazard_engine import compute_hazard_suite
from app.engines.risk_engine import compute_composite_risk
from app.engines.relocation_engine import compute_relocation_priority, compute_haversine_distance

def run_rainfall_simulation(
    habitations: List[Dict[str, Any]],
    candidate_sites: List[Dict[str, Any]],
    rainfall_increment_mm: float,
    target_panchayats: List[str] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Simulates an extreme weather event:
    Increases 24h rainfall across affected habitations, triggers pipeline re-computation,
    detects priority tier escalations, and produces live command alerts.
    """
    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    escalated_habitations = []
    generated_alerts = []
    updated_habitations = []

    # Find nearest candidate site distance for each village
    valid_sites = [s for s in candidate_sites if not s.get("is_inside_hazard_zone", False)]

    for h in habitations:
        prev_tier = h.get("priority", {}).get("priority_tier", "MONITOR")
        prev_risk_band = h.get("risk", {}).get("risk_band", "GREEN")
        prev_risk_score = h.get("risk", {}).get("composite_risk", 0.0)

        # Check if panchayat matches filter (or apply to all if None)
        apply_event = True
        if target_panchayats and h.get("panchayat") not in target_panchayats:
            apply_event = False

        if apply_event:
            new_rainfall = h.get("baseline_rainfall_24h_mm", 80.0) + rainfall_increment_mm
        else:
            new_rainfall = h.get("current_rainfall_24h_mm", 80.0)

        h["current_rainfall_24h_mm"] = new_rainfall

        # 1. Recompute Hazards
        hazards, hazard_meta = compute_hazard_suite(h, rainfall_override=new_rainfall)
        h["hazards"] = hazards

        # 2. Recompute Risk
        risk_data, new_risk_band = compute_composite_risk(
            hazard_index=hazards["composite_hazard_index"],
            landslide_score=hazards["landslide_score"],
            flood_score=hazards["flood_score"],
            cloudburst_score=hazards["cloudburst_score"],
            population=h["population"],
            vulnerability_index=h.get("vulnerability", {}).get("vulnerability_index", 0.45),
            historical_disasters=h.get("historical_disasters_10y", 1),
            panchayat=h.get("panchayat", ""),
            village_name=h["name"]
        )
        h["risk"] = risk_data

        # 3. Find nearest safe site distance
        min_dist = 15.0
        if valid_sites:
            distances = [
                compute_haversine_distance(h["latitude"], h["longitude"], s["latitude"], s["longitude"])
                for s in valid_sites
            ]
            min_dist = min(distances) if distances else 15.0

        # 4. Recompute Priority
        priority_data, new_tier = compute_relocation_priority(
            hazard_index=hazards["composite_hazard_index"],
            landslide_score=hazards["landslide_score"],
            flood_score=hazards["flood_score"],
            cloudburst_score=hazards["cloudburst_score"],
            vulnerability_index=h.get("vulnerability", {}).get("vulnerability_index", 0.45),
            population=h["population"],
            historical_disasters=h.get("historical_disasters_10y", 1),
            nearest_safe_site_distance_km=min_dist
        )
        h["priority"] = priority_data

        # Check for Escalations
        is_tier_escalated = (new_tier in ["IMMEDIATE", "SHORT_TERM"] and prev_tier != new_tier) or (new_risk_band == "RED" and prev_risk_band != "RED")

        if is_tier_escalated:
            escalated_habitations.append({
                "id": h["id"],
                "name": h["name"],
                "panchayat": h["panchayat"],
                "previous_tier": prev_tier,
                "new_tier": new_tier,
                "previous_risk": prev_risk_score,
                "new_risk": risk_data["composite_risk"],
                "population": h["population"]
            })

            # Generate Alert
            alert_severity = "CRITICAL" if new_tier == "IMMEDIATE" else "HIGH"
            generated_alerts.append({
                "id": f"ALT_{h['id']}_{int(datetime.datetime.now().timestamp())}",
                "timestamp": now_iso,
                "severity": alert_severity,
                "habitation_id": h["id"],
                "habitation_name": h["name"],
                "panchayat": h["panchayat"],
                "message": (
                    f"CRITICAL ESCALATION: {h['name']} ({h['panchayat']}) has escalated from {prev_tier} to {new_tier} "
                    f"following {int(rainfall_increment_mm)}mm precipitation influx. Risk Score surged to {risk_data['composite_risk']}/100."
                ),
                "action_required": "Initiate immediate evacuation staging and review candidate relocation site allocations."
            })

        updated_habitations.append(h)

    # If general rainfall is high, add weather alert
    if rainfall_increment_mm >= 150.0:
        generated_alerts.insert(0, {
            "id": f"ALT_WX_{int(datetime.datetime.now().timestamp())}",
            "timestamp": now_iso,
            "severity": "CRITICAL",
            "habitation_id": "DISTRICT_WIDE",
            "habitation_name": "Wayanad District",
            "panchayat": "All Taluks",
            "message": f"RED METEOROLOGICAL ALERT: Extreme rainfall event (+{int(rainfall_increment_mm)}mm) detected. Multiple escarpment zones saturated.",
            "action_required": "NDRF Battalions and DDMA on active standby."
        })

    return updated_habitations, escalated_habitations, generated_alerts
