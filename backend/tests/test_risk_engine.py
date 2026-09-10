"""
Test Suite: Risk Engine & Max-Rule Formulation
Verifies that multi-hazard combinations follow the non-diluting max-rule-plus-residual
and that red-zone banding and plain-language explanations are mathematically sound.
"""
import pytest
from app.engines.risk_engine import compute_composite_risk
from app.engines.hazard_engine import compute_flood_hazard, compute_cloudburst_hazard

def test_flood_hazard_hydrology():
    # Low HAND (1.0m) + heavy rain (180mm) + close river (50m) should yield high flood hazard
    high_flood = compute_flood_hazard(hand_m=1.0, rainfall_24h_mm=180.0, distance_to_river_m=50.0)
    assert 0.70 <= high_flood <= 1.0

    # High HAND (20m) + low rain (30mm) + far river (1000m) should yield very low flood hazard
    low_flood = compute_flood_hazard(hand_m=20.0, rainfall_24h_mm=30.0, distance_to_river_m=1000.0)
    assert low_flood < 0.20

def test_cloudburst_hazard():
    # Extreme rainfall >= 200mm should produce >= 0.90 hazard
    extreme_cb = compute_cloudburst_hazard(slope_deg=35.0, rainfall_24h_mm=220.0, elevation_m=900.0)
    assert extreme_cb >= 0.90

def test_composite_risk_max_rule_override():
    # Habitation with catastrophic landslide (0.95) but low flood (0.10) must be categorized as RED
    risk_assessment, band = compute_composite_risk(
        hazard_index=0.85,
        landslide_score=0.95,
        flood_score=0.10,
        cloudburst_score=0.20,
        population=2500,
        vulnerability_index=0.60,
        historical_disasters=4,
        panchayat="Meppadi",
        village_name="Chooralmala"
    )
    assert band == "RED"
    assert risk_assessment["composite_risk"] >= 70.0
    assert "RED ZONE" in risk_assessment["human_readable_explanation"]
    assert risk_assessment["contributing_factors"]["hazard_contribution_pct"] > 0

def test_risk_explanation_generation():
    risk_assessment, band = compute_composite_risk(
        hazard_index=0.20,
        landslide_score=0.15,
        flood_score=0.10,
        cloudburst_score=0.10,
        population=1200,
        vulnerability_index=0.25,
        historical_disasters=0,
        panchayat="Nenmeni",
        village_name="Nenmeni Safe Ridge"
    )
    assert band == "GREEN"
    assert "GREEN ZONE" in risk_assessment["human_readable_explanation"]
