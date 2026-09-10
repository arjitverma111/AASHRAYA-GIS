"""
Relocation Engine
Evaluates relocation urgency priority scores, maps habitations into action tiers
(IMMEDIATE, SHORT_TERM, MEDIUM_TERM, MONITOR), and generates plain-language rationales (PRD §7, FR-8, FR-9).
"""
import math
from typing import Dict, Any, Tuple
from app.config import PRIORITY_CONFIG

def compute_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in kilometers.
    """
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def compute_relocation_priority(
    hazard_index: float,
    landslide_score: float,
    flood_score: float,
    cloudburst_score: float,
    vulnerability_index: float,
    population: int,
    historical_disasters: int,
    nearest_safe_site_distance_km: float = 12.0
) -> Tuple[Dict[str, Any], str]:
    """
    Computes 0.0 - 1.0 Relocation Priority Score and determines the urgency tier:
    - IMMEDIATE: Priority >= 0.75 OR any single hazard sub-score >= 0.90
    - SHORT_TERM: 0.50 <= Priority < 0.75
    - MEDIUM_TERM: 0.30 <= Priority < 0.50
    - MONITOR: Priority < 0.30
    """
    cfg = PRIORITY_CONFIG

    # Normalize Exposure (capped at 5,000)
    norm_exposure = min(population / 5000.0, 1.0)
    # Normalize History (0 to 5 events)
    norm_history = min(historical_disasters / 5.0, 1.0)
    # Safe site accessibility: closer is better, so (1 - availability_penalty)
    # If nearest site is > 30km, availability factor is low
    site_availability = max(0.0, 1.0 - (nearest_safe_site_distance_km / 35.0))

    # Priority formula
    w_haz = cfg["WEIGHT_HAZARD_SEVERITY"]
    w_vuln = cfg["WEIGHT_VULNERABILITY"]
    w_exp = cfg["WEIGHT_EXPOSURE"]
    w_hist = cfg["WEIGHT_DISASTER_HISTORY"]
    w_site = cfg["WEIGHT_SAFE_SITE_ACCESSIBILITY"]

    raw_priority = (
        w_haz * hazard_index +
        w_vuln * vulnerability_index +
        w_exp * norm_exposure +
        w_hist * norm_history +
        w_site * (1.0 - site_availability) # higher penalty if safe sites are far
    )
    priority_score = round(min(max(raw_priority, 0.0), 1.0), 3)

    # Catastrophic Single-Hazard Override (PRD §7)
    is_catastrophic_hazard = max(landslide_score, flood_score, cloudburst_score) >= cfg["HAZARD_IMMEDIATE_OVERRIDE"]

    if priority_score >= cfg["TIER_IMMEDIATE_THRESHOLD"] or is_catastrophic_hazard:
        tier = "IMMEDIATE"
        action = "Immediate evacuation readiness and expedited permanent relocation planning this monsoon."
    elif priority_score >= cfg["TIER_SHORT_TERM_THRESHOLD"]:
        tier = "SHORT_TERM"
        action = "Relocation priority for upcoming seasonal planning cycle (12-month budget allocation)."
    elif priority_score >= cfg["TIER_MEDIUM_TERM_THRESHOLD"]:
        tier = "MEDIUM_TERM"
        action = "Medium-term phased structural mitigation and site capacity reservation."
    else:
        tier = "MONITOR"
        action = "Routine telemetry observation and disaster awareness drills."

    rationale = _generate_priority_rationale(
        tier=tier,
        priority_score=priority_score,
        hazard_index=hazard_index,
        vulnerability_index=vulnerability_index,
        population=population,
        is_catastrophic_hazard=is_catastrophic_hazard,
        nearest_safe_site_distance_km=nearest_safe_site_distance_km
    )

    priority_data = {
        "priority_score": priority_score,
        "priority_tier": tier,
        "rationale": rationale,
        "recommended_action": action,
        "is_catastrophic_hazard_override": is_catastrophic_hazard,
        "contributing_weights": {
            "hazard_severity": round(w_haz * hazard_index, 3),
            "vulnerability": round(w_vuln * vulnerability_index, 3),
            "population_exposed": round(w_exp * norm_exposure, 3),
            "disaster_frequency": round(w_hist * norm_history, 3),
            "site_isolation_penalty": round(w_site * (1.0 - site_availability), 3)
        }
    }

    return priority_data, tier

def _generate_priority_rationale(
    tier: str,
    priority_score: float,
    hazard_index: float,
    vulnerability_index: float,
    population: int,
    is_catastrophic_hazard: bool,
    nearest_safe_site_distance_km: float
) -> str:
    if is_catastrophic_hazard:
        return (
            f"Ranked as IMMEDIATE priority (Override trigger). Severe active hazard index of {hazard_index:.2f} "
            f"threatens {population:,} residents. A safe alternative relocation site is identified within "
            f"{nearest_safe_site_distance_km:.1f} km."
        )
    elif tier == "IMMEDIATE":
        return (
            f"Ranked as IMMEDIATE priority ({priority_score:.2f}/1.00). High compound hazard ({hazard_index:.2f}) "
            f"converges with significant community vulnerability ({vulnerability_index:.2f}) across {population:,} inhabitants. "
            f"Safe candidate relocation site is accessible within {nearest_safe_site_distance_km:.1f} km."
        )
    elif tier == "SHORT_TERM":
        return (
            f"Ranked as SHORT-TERM priority ({priority_score:.2f}/1.00). High baseline hazard and vulnerable demographic profile "
            f"warrant programmed relocation within the current fiscal planning cycle."
        )
    elif tier == "MEDIUM_TERM":
        return (
            f"Ranked as MEDIUM-TERM priority ({priority_score:.2f}/1.00). Moderate hazard risks require proactive site reservation "
            f"and infrastructure reinforcement."
        )
    else:
        return f"Ranked as MONITOR ({priority_score:.2f}/1.00). Current risks are within baseline coping capacity."
