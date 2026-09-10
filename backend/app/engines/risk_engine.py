"""
Risk Engine
Implements multi-hazard risk formulation, red-zone banding,
and formula-level plain language explainability (PRD §5, §20, FR-4, FR-5, FR-7).
"""
from typing import Dict, Any, Tuple
from app.config import RISK_CONFIG

def compute_composite_risk(
    hazard_index: float,
    landslide_score: float,
    flood_score: float,
    cloudburst_score: float,
    population: int,
    vulnerability_index: float,
    historical_disasters: int,
    panchayat: str,
    village_name: str
) -> Tuple[Dict[str, Any], str]:
    """
    Computes normalized 0-100 composite risk score, assigns risk band,
    and generates human-readable decision rationale.
    """
    cfg = RISK_CONFIG

    # Normalize Exposure: village population capped at 6,000 for rural normalization
    norm_exposure = min(population / 5000.0, 1.0)

    # Normalize Historical Disasters: 0 to 5+ events in past 10 years
    norm_history = min(historical_disasters / 5.0, 1.0)

    # Weighted sum
    w_h = cfg["WEIGHT_HAZARD"]
    w_e = cfg["WEIGHT_EXPOSURE"]
    w_v = cfg["WEIGHT_VULNERABILITY"]
    w_hist = cfg["WEIGHT_HISTORY"]

    raw_risk = (
        w_h * hazard_index
        + w_e * norm_exposure
        + w_v * vulnerability_index
        + w_hist * norm_history
    )
    composite_risk = round(raw_risk * 100.0, 1)

    # Red Zone Banding (PRD §5)
    # Floor rule: Any extreme single hazard >= 0.85 forces RED classification
    is_single_hazard_override = max(landslide_score, flood_score, cloudburst_score) >= cfg["SINGLE_HAZARD_RED_OVERRIDE"]

    if composite_risk >= cfg["RED_ZONE_THRESHOLD"] or is_single_hazard_override:
        risk_band = "RED"
    elif composite_risk >= cfg["ORANGE_ZONE_THRESHOLD"]:
        risk_band = "ORANGE"
    elif composite_risk >= cfg["WATCH_ZONE_THRESHOLD"]:
        risk_band = "WATCH"
    else:
        risk_band = "GREEN"

    # Percentage Contribution Breakdown
    total_components = (w_h * hazard_index) + (w_e * norm_exposure) + (w_v * vulnerability_index) + (w_hist * norm_history)
    safe_denom = total_components if total_components > 0.001 else 1.0

    contributions = {
        "hazard_contribution_pct": round(((w_h * hazard_index) / safe_denom) * 100, 1),
        "population_exposure_pct": round(((w_e * norm_exposure) / safe_denom) * 100, 1),
        "vulnerability_pct": round(((w_v * vulnerability_index) / safe_denom) * 100, 1),
        "disaster_history_pct": round(((w_hist * norm_history) / safe_denom) * 100, 1)
    }

    # Generate Plain-Language Explanation
    explanation = _generate_explanation(
        village_name=village_name,
        risk_band=risk_band,
        composite_risk=composite_risk,
        landslide_score=landslide_score,
        flood_score=flood_score,
        cloudburst_score=cloudburst_score,
        population=population,
        vulnerability_index=vulnerability_index,
        historical_disasters=historical_disasters,
        is_single_hazard_override=is_single_hazard_override
    )

    assessment = {
        "composite_risk": composite_risk,
        "risk_band": risk_band,
        "hazard_component": round(hazard_index, 3),
        "exposure_component": round(norm_exposure, 3),
        "vulnerability_component": round(vulnerability_index, 3),
        "historical_component": round(norm_history, 3),
        "contributing_factors": contributions,
        "human_readable_explanation": explanation,
        "confidence": 0.94 if historical_disasters > 0 else 0.88
    }

    return assessment, risk_band

def _generate_explanation(
    village_name: str,
    risk_band: str,
    composite_risk: float,
    landslide_score: float,
    flood_score: float,
    cloudburst_score: float,
    population: int,
    vulnerability_index: float,
    historical_disasters: int,
    is_single_hazard_override: bool
) -> str:
    # Identify dominant hazard
    max_h = max(landslide_score, flood_score, cloudburst_score)
    if max_h == landslide_score:
        dominant_hazard = f"landslide instability (susceptibility: {int(landslide_score*100)}%)"
    elif max_h == flood_score:
        dominant_hazard = f"riverine flood inundation (score: {int(flood_score*100)}%)"
    else:
        dominant_hazard = f"flash cloudburst runoff (score: {int(cloudburst_score*100)}%)"

    vuln_desc = "high" if vulnerability_index > 0.6 else ("moderate" if vulnerability_index > 0.4 else "low")

    if risk_band == "RED":
        override_note = " (triggered by single-hazard catastrophic threshold override)" if is_single_hazard_override and composite_risk < 70.0 else ""
        return (
            f"Classified as RED ZONE (Score: {composite_risk}/100){override_note}. "
            f"{village_name} has critical exposure to {dominant_hazard}, exposing a population of {population:,}. "
            f"Demographic vulnerability is {vuln_desc} ({int(vulnerability_index*100)}%) with {historical_disasters} recorded disaster events "
            f"in the past decade. Relocation action is prioritized."
        )
    elif risk_band == "ORANGE":
        return (
            f"Classified as ORANGE (High Risk: {composite_risk}/100). "
            f"Significant vulnerability to {dominant_hazard} impacting {population:,} residents. "
            f"Requires expedited mitigation, evacuation readiness, and planned relocation review."
        )
    elif risk_band == "WATCH":
        return (
            f"Classified as WATCH ZONE (Moderate Risk: {composite_risk}/100). "
            f"Moderate hazard exposure ({dominant_hazard}) with manageable local coping capacity. "
            f"Continuous sensor and weather monitoring recommended."
        )
    else:
        return (
            f"Classified as GREEN ZONE (Low Risk: {composite_risk}/100). "
            f"Minimal current exposure to active terrain or hydrological hazards. Safe for continuous habitation."
        )
