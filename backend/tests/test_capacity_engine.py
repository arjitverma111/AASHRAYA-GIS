"""
Test Suite: Carrying Capacity Engine
Verifies multi-factor bottleneck identification and safety margin calculations.
"""
from app.engines.capacity_engine import evaluate_site_carrying_capacity, score_site_suitability

def test_carrying_capacity_water_bottleneck():
    site = {
        "usable_area_ha": 40.0,
        "existing_population": 800,
        "capacities": {
            "land_capacity": 5000,
            "water_capacity": 2500, # BINDING BOTTLENECK
            "power_capacity": 4500,
            "health_capacity": 3000,
            "school_capacity": 3500
        }
    }
    result = evaluate_site_carrying_capacity(site, safety_margin=0.85)

    assert result["raw_bottleneck_capacity"] == 2500
    assert "Water Supply Headroom" in result["binding_constraint"]
    # Effective capacity = floor(2500 * 0.85) = 2125
    assert result["effective_capacity"] == 2125
    # Available = 2125 - 800 = 1325
    assert result["available_capacity"] == 1325

def test_hard_exclusion_filtering():
    # Site inside hazard zone should receive zero suitability score
    hazardous_site = {
        "is_inside_hazard_zone": True,
        "is_protected_eco_area": False,
        "safety_score": 0.4,
        "infra_access_score": 0.5
    }
    score, breakdown = score_site_suitability(hazardous_site, distance_km=5.0)
    assert score == 0.0
    assert "Hard exclusion" in breakdown["exclusion_reason"]
