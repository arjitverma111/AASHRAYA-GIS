"""
Test Suite: Optimization Engine (MILP)
Verifies exact integer linear programming allocation and escalation of infeasible habitations.
"""
from app.engines.optimization_engine import solve_relocation_allocation

def test_milp_solver_successful_allocation():
    habitations = [
        {
            "id": "V1",
            "name": "Village North",
            "population": 1200,
            "latitude": 11.53,
            "longitude": 76.17,
            "demographics": {"livelihood_farming_pct": 0.5},
            "priority": {"priority_tier": "IMMEDIATE"}
        },
        {
            "id": "V2",
            "name": "Village South",
            "population": 1500,
            "latitude": 11.54,
            "longitude": 76.18,
            "demographics": {"livelihood_farming_pct": 0.6},
            "priority": {"priority_tier": "IMMEDIATE"}
        }
    ]
    sites = [
        {
            "id": "S1",
            "name": "Plateau Safe Hub",
            "latitude": 11.60,
            "longitude": 76.10,
            "available_capacity": 3000,
            "safety_score": 0.95,
            "infra_access_score": 0.90,
            "is_inside_hazard_zone": False,
            "is_protected_eco_area": False
        }
    ]

    result = solve_relocation_allocation(habitations, sites)
    assert result["status"] == "COMPLETED"
    assert result["assigned_count"] == 2
    assert result["escalated_count"] == 0
    assert result["total_population_relocated"] == 2700
    for a in result["assignments"]:
        assert a["status"] == "OPTIMAL_ASSIGNED"
        assert a["site_id"] == "S1"

def test_milp_solver_infeasibility_escalation():
    # Large population that exceeds site capacity
    habitations = [
        {
            "id": "V_LARGE",
            "name": "Large Vulnerable Town",
            "population": 6000,
            "latitude": 11.53,
            "longitude": 76.17,
            "demographics": {"livelihood_farming_pct": 0.5},
            "priority": {"priority_tier": "IMMEDIATE"}
        }
    ]
    sites = [
        {
            "id": "S_SMALL",
            "name": "Small Relief Post",
            "latitude": 11.60,
            "longitude": 76.10,
            "available_capacity": 2000, # INSUFFICIENT
            "safety_score": 0.95,
            "infra_access_score": 0.90,
            "is_inside_hazard_zone": False,
            "is_protected_eco_area": False
        }
    ]

    result = solve_relocation_allocation(habitations, sites)
    assert result["status"] == "COMPLETED"
    assert result["escalated_count"] == 1
    assert result["assigned_count"] == 0
    assert result["assignments"][0]["status"] == "ESCALATE_INFEASIBLE"
    assert "insufficient" in result["assignments"][0]["reason"].lower() or "escalate" in result["assignments"][0]["reason"].lower()
