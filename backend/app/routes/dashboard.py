"""
Dashboard Route
Provides high-level command center statistics, priority distributions,
active critical alerts, and capacity status (PRD §15, Page 1).
"""
from fastapi import APIRouter
from app.data.data_store import db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_summary():
    habitations = db.habitations
    sites = db.candidate_sites

    # Urgency Priority Counts
    immediate = [h for h in habitations if h.get("priority", {}).get("priority_tier") == "IMMEDIATE"]
    short_term = [h for h in habitations if h.get("priority", {}).get("priority_tier") == "SHORT_TERM"]
    medium_term = [h for h in habitations if h.get("priority", {}).get("priority_tier") == "MEDIUM_TERM"]
    monitor = [h for h in habitations if h.get("priority", {}).get("priority_tier") == "MONITOR"]

    # Red Zone Count
    red_zone_habs = [h for h in habitations if h.get("risk", {}).get("risk_band") == "RED"]

    # Population metrics
    total_exposed_pop = sum(h["population"] for h in red_zone_habs + [h for h in habitations if h.get("risk", {}).get("risk_band") == "ORANGE"])
    pop_requiring_relocation = sum(h["population"] for h in immediate + short_term)

    # Capacity metrics (from non-excluded sites)
    valid_sites = [s for s in sites if not s.get("is_inside_hazard_zone", False) and not s.get("is_protected_eco_area", False)]
    total_safe_capacity = sum(s.get("available_capacity", 0) for s in valid_sites)

    # Hazard distribution
    hazard_dist = {
        "Landslide Critical": len([h for h in habitations if h.get("hazards", {}).get("landslide_score", 0) > 0.7]),
        "Flood Inundation High": len([h for h in habitations if h.get("hazards", {}).get("flood_score", 0) > 0.6]),
        "Cloudburst Runoff Active": len([h for h in habitations if h.get("hazards", {}).get("cloudburst_score", 0) > 0.6]),
        "Compound Multi-Hazard": len(red_zone_habs)
    }

    # Urgency priority distribution
    priority_dist = {
        "IMMEDIATE": len(immediate),
        "SHORT_TERM": len(short_term),
        "MEDIUM_TERM": len(medium_term),
        "MONITOR": len(monitor)
    }

    # Command status flags
    system_status = {
        "gis_engine": "ONLINE (SRTM 30m / Vector Active)",
        "ml_susceptibility": "ONLINE (Random Forest 100-Trees Loaded)",
        "risk_engine": "ONLINE (Max-Rule-Plus-Residual v2.1)",
        "optimization_solver": "ONLINE (PuLP / CBC MILP Ready)",
        "capacity_engine": "ONLINE (Bottleneck + 15% Buffer Active)",
        "hazard_feed": "SIMULATED_REPLAY (IMD Wayanad Replay 2024)"
    }

    return {
        "total_habitations_assessed": len(habitations),
        "critical_immediate_count": len(immediate),
        "short_term_count": len(short_term),
        "medium_term_count": len(medium_term),
        "monitor_count": len(monitor),
        "red_zone_habitations_count": len(red_zone_habs),
        "total_population_exposed": total_exposed_pop,
        "population_requiring_relocation": pop_requiring_relocation,
        "total_safe_capacity_available": total_safe_capacity,
        "candidate_sites_count": len(valid_sites),
        "active_alerts": db.active_alerts,
        "hazard_distribution": hazard_dist,
        "priority_distribution": priority_dist,
        "system_status": system_status,
        "current_simulation_state": db.simulation_state
    }
