"""
Analytics Route
Supplies formatted data structures for frontend Recharts data visualizations (PRD Page 6).
"""
from fastapi import APIRouter
from app.data.data_store import db

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_spatial_analytics():
    habitations = db.habitations
    sites = db.candidate_sites

    # 1. Habitation Risk vs. Population Chart Data
    risk_pop_data = []
    for h in sorted(habitations, key=lambda x: x.get("risk", {}).get("composite_risk", 0), reverse=True):
        risk_pop_data.append({
            "name": h["name"],
            "panchayat": h["panchayat"],
            "composite_risk": h.get("risk", {}).get("composite_risk", 0),
            "priority_score": round(h.get("priority", {}).get("priority_score", 0) * 100, 1),
            "population": h["population"],
            "tier": h.get("priority", {}).get("priority_tier", "MONITOR"),
            "risk_band": h.get("risk", {}).get("risk_band", "GREEN")
        })

    # 2. Candidate Site Capacity Bottlenecks
    valid_sites = [s for s in sites if not s.get("is_inside_hazard_zone", False) and not s.get("is_protected_eco_area", False)]
    site_capacity_data = []
    for s in valid_sites:
        caps = s.get("capacity_breakdown", {})
        site_capacity_data.append({
            "site_name": s["name"].replace(" Resettlement Cluster", "").replace(" Greenfield Hub", "").replace(" Relief Plateau", "").replace(" Resilient Township Zone", "").replace(" High Grounds", "").replace(" North Ridge Safe Zone", ""),
            "land_capacity": caps.get("land_capacity", 0),
            "water_capacity": caps.get("water_capacity", 0),
            "power_capacity": caps.get("power_capacity", 0),
            "health_capacity": caps.get("health_capacity", 0),
            "school_capacity": caps.get("school_capacity", 0),
            "effective_capacity": s.get("effective_capacity", 0),
            "binding_constraint": s.get("binding_constraint", "").split(" (")[0]
        })

    # 3. Hazard Contribution Breakdown
    hazard_totals = {"Landslide": 0.0, "Flood": 0.0, "Cloudburst": 0.0}
    for h in habitations:
        hz = h.get("hazards", {})
        hazard_totals["Landslide"] += hz.get("landslide_score", 0.0)
        hazard_totals["Flood"] += hz.get("flood_score", 0.0)
        hazard_totals["Cloudburst"] += hz.get("cloudburst_score", 0.0)

    total_hz = sum(hazard_totals.values()) or 1.0
    hazard_pie = [
        {"name": "Landslide Hazard", "value": round((hazard_totals["Landslide"] / total_hz) * 100, 1), "fill": "#ef4444"},
        {"name": "Flood Inundation", "value": round((hazard_totals["Flood"] / total_hz) * 100, 1), "fill": "#3b82f6"},
        {"name": "Cloudburst Runoff", "value": round((hazard_totals["Cloudburst"] / total_hz) * 100, 1), "fill": "#a855f7"}
    ]

    # 4. Tehsil / Taluk Comparisons
    tehsil_stats = {}
    for h in habitations:
        t = h.get("tehsil", "Other")
        if t not in tehsil_stats:
            tehsil_stats[t] = {
                "tehsil": t,
                "habitations_count": 0,
                "total_population": 0,
                "immediate_count": 0,
                "red_zone_count": 0,
                "avg_risk": 0.0,
                "total_risk_accum": 0.0
            }
        tehsil_stats[t]["habitations_count"] += 1
        tehsil_stats[t]["total_population"] += h["population"]
        if h.get("priority", {}).get("priority_tier") == "IMMEDIATE":
            tehsil_stats[t]["immediate_count"] += 1
        if h.get("risk", {}).get("risk_band") == "RED":
            tehsil_stats[t]["red_zone_count"] += 1
        tehsil_stats[t]["total_risk_accum"] += h.get("risk", {}).get("composite_risk", 0.0)

    for t, stat in tehsil_stats.items():
        count = max(stat["habitations_count"], 1)
        stat["avg_risk"] = round(stat["total_risk_accum"] / count, 1)

    return {
        "habitation_risk_ranking": risk_pop_data,
        "site_capacity_bottlenecks": site_capacity_data,
        "hazard_composition_share": hazard_pie,
        "tehsil_comparative_summary": list(tehsil_stats.values())
    }
