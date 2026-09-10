"""
Carrying Capacity Engine
Implements multi-dimensional bottleneck assessment with safety margins
for candidate relocation sites (PRD §9, FR-12, FR-13).
"""
import math
from typing import Dict, Any, Tuple
from app.config import PLANNING_NORMS

def evaluate_site_carrying_capacity(site_data: Dict[str, Any], safety_margin: float = None) -> Dict[str, Any]:
    """
    Evaluates carrying capacity across Land, Water, Power, Healthcare, and Education.
    Computes the binding constraint (the minimum headroom) and applies the mandatory safety margin.
    """
    if safety_margin is None:
        safety_margin = PLANNING_NORMS["DEFAULT_SAFETY_MARGIN"]

    capacities = site_data.get("capacities", {})
    existing_pop = site_data.get("existing_population", 0)

    # 5 Dimensions
    land_cap = capacities.get("land_capacity", int(site_data.get("usable_area_ha", 10.0) * PLANNING_NORMS["RURAL_DENSITY_PER_HA"]))
    water_cap = capacities.get("water_capacity", 3000)
    power_cap = capacities.get("power_capacity", 4000)
    health_cap = capacities.get("health_capacity", 2500)
    school_cap = capacities.get("school_capacity", 3000)

    dimension_caps = {
        "Land Availability (125 persons/ha)": land_cap,
        "Water Supply Headroom (100 LPCD norm)": water_cap,
        "Power Substation Headroom (0.5 kW/hh)": power_cap,
        "Primary Health Centre (PHC) Capacity": health_cap,
        "School & Education Headroom (RTE norm)": school_cap
    }

    # Find binding constraint (minimum)
    binding_dimension, raw_bottleneck = min(dimension_caps.items(), key=lambda item: item[1])

    # Apply safety margin
    effective_cap = int(math.floor(raw_bottleneck * safety_margin))
    available_net = max(0, effective_cap - existing_pop)

    breakdown = {
        "land_capacity": land_cap,
        "water_capacity": water_cap,
        "power_capacity": power_cap,
        "health_capacity": health_cap,
        "school_capacity": school_cap
    }

    return {
        "raw_bottleneck_capacity": raw_bottleneck,
        "effective_capacity": effective_cap,
        "existing_population": existing_pop,
        "available_capacity": available_net,
        "binding_constraint": f"{binding_dimension} ({raw_bottleneck:,} gross limit)",
        "safety_margin_applied": safety_margin,
        "capacity_breakdown": breakdown,
        "utilization_pct": round((existing_pop / max(effective_cap, 1)) * 100, 1)
    }

def score_site_suitability(
    site_data: Dict[str, Any],
    distance_km: float = 0.0
) -> Tuple[float, Dict[str, float]]:
    """
    Computes 0.0 to 1.0 composite suitability score based on safety,
    infrastructure access, socioeconomic compatibility, and distance.
    Filters out hard-excluded sites (PRD §8, FR-10, FR-11).
    """
    # Hard Exclusions: Inside Hazard Red Zone OR Eco-Sensitive Forest
    if site_data.get("is_inside_hazard_zone", False) or site_data.get("is_protected_eco_area", False):
        return 0.0, {
            "safety": 0.0,
            "infrastructure": 0.0,
            "accessibility": 0.0,
            "environmental_clearance": 0.0,
            "exclusion_reason": "Hard exclusion: Site is inside a hazard red zone or protected eco-sensitive reserve."
        }

    safety = site_data.get("safety_score", 0.90)
    infra = site_data.get("infra_access_score", 0.85)
    socio = site_data.get("socioeconomic_score", 0.85)
    env_flag = site_data.get("environmental_constraint_flag", 1.0)

    # Distance factor: closer is preferred (within 35 km)
    distance_factor = max(0.0, 1.0 - (distance_km / 35.0))

    composite = (0.35 * safety + 0.30 * infra + 0.20 * socio + 0.15 * distance_factor) * env_flag

    factors = {
        "site_safety": round(safety, 3),
        "infrastructure_readiness": round(infra, 3),
        "socioeconomic_cohesion": round(socio, 3),
        "distance_proximity": round(distance_factor, 3)
    }

    return round(composite, 4), factors
