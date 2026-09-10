"""
Simulation Route
Provides dynamic extreme rainfall injection and state reset endpoints (PRD §11, FR-21, FR-22).
"""
import datetime
from fastapi import APIRouter
from app.data.data_store import db
from app.models.schemas import SimulationRequest, SimulationResponse
from app.engines.simulation_engine import run_rainfall_simulation

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.post("/heavy-rainfall")
def inject_heavy_rainfall(payload: SimulationRequest):
    """
    Simulates severe monsoon rainfall influx (+50 to +250mm).
    Recalculates Landslide ML, HAND Flood, Risk indices, Priority tiers,
    and returns escalated villages and new command alerts.
    """
    updated_habs, escalated, alerts = run_rainfall_simulation(
        habitations=db.habitations,
        candidate_sites=db.candidate_sites,
        rainfall_increment_mm=payload.rainfall_increment_mm,
        target_panchayats=payload.target_panchayats
    )

    db.habitations = updated_habs
    # Prepend new alerts
    db.active_alerts = alerts + db.active_alerts

    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.simulation_state = {
        "is_active": True,
        "injected_rainfall_mm": payload.rainfall_increment_mm,
        "simulated_timestamp": now_iso
    }

    # Log to audit trail
    db.add_audit_log({
        "id": f"AUD_SIM_{int(datetime.datetime.now().timestamp() * 1000)}",
        "timestamp": now_iso,
        "habitation_id": "ALL_AFFECTED",
        "habitation_name": f"Extreme Rain Injection (+{int(payload.rainfall_increment_mm)}mm)",
        "action": "WEATHER_SIMULATION_TRIGGERED",
        "operator_role": "GIS Analyst / System Simulator",
        "operator_name": "Command Center Simulator",
        "justification": f"Injected simulated extreme rainfall of {payload.rainfall_increment_mm}mm to test re-computation pipeline.",
        "overridden_site_id": None,
        "previous_tier": None,
        "new_tier": f"{len(escalated)} habitations escalated"
    })

    return {
        "simulation_active": True,
        "injected_rainfall_mm": payload.rainfall_increment_mm,
        "affected_habitations_count": len(updated_habs),
        "escalated_to_immediate_count": len([e for e in escalated if e["new_tier"] == "IMMEDIATE"]),
        "escalated_villages": escalated,
        "generated_alerts": alerts,
        "timestamp": now_iso
    }

@router.post("/reset")
def reset_simulation():
    """Resets all simulation parameters back to baseline pre-monsoon conditions."""
    db.reset_to_baseline()
    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db.add_audit_log({
        "id": f"AUD_RST_{int(datetime.datetime.now().timestamp() * 1000)}",
        "timestamp": now_iso,
        "habitation_id": "SYSTEM",
        "habitation_name": "Platform State Reset",
        "action": "BASELINE_RESTORED",
        "operator_role": "System Administrator",
        "operator_name": "Command Center Console",
        "justification": "Restored baseline pre-monsoon hazard telemetry and cleared weather simulations.",
        "overridden_site_id": None,
        "previous_tier": None,
        "new_tier": None
    })

    return {
        "status": "RESET_SUCCESSFUL",
        "message": "Baseline pre-monsoon conditions successfully restored.",
        "timestamp": now_iso
    }
