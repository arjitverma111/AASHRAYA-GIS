"""
Test Suite: Dynamic Weather Simulation & Live Recomputation
Verifies that injecting heavy rainfall dynamically elevates hazard indices,
escalates habitations into Immediate tiers, and generates critical alerts.
"""
from app.data.data_store import DataStore
from app.engines.simulation_engine import run_rainfall_simulation

def test_rainfall_simulation_escalation():
    test_db = DataStore()
    baseline_immediate = len([h for h in test_db.habitations if h["priority"]["priority_tier"] == "IMMEDIATE"])

    # Inject 180mm extreme rainfall
    updated_habs, escalated, alerts = run_rainfall_simulation(
        habitations=test_db.habitations,
        candidate_sites=test_db.candidate_sites,
        rainfall_increment_mm=180.0
    )

    new_immediate = len([h for h in updated_habs if h["priority"]["priority_tier"] == "IMMEDIATE"])
    # After 180mm rainfall, immediate count should increase
    assert new_immediate >= baseline_immediate
    assert len(escalated) > 0
    assert len(alerts) > 0
    assert any("CRITICAL" in a.get("severity", "") for a in alerts)
