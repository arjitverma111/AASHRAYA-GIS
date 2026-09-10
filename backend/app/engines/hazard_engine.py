"""
Hazard Engine
Calculates per-hazard scores (Landslide, Flood, Cloudburst Runoff)
and combines them using the Max-Rule-Plus-Residual formulation (PRD §5).
"""
import math
from typing import Dict, Any, Tuple
from app.config import HAZARD_CONFIG
from app.engines.ml_susceptibility import ml_model

def compute_flood_hazard(hand_m: float, rainfall_24h_mm: float, distance_to_river_m: float) -> float:
    """
    Computes flood inundation score (0.0 to 1.0) using Height Above Nearest Drainage (HAND)
    hydrological formulation scaled by antecedent precipitation.
    Low HAND (< 2m) + High rainfall + River proximity (< 100m) produces high score.
    """
    hand_factor = math.exp(-max(hand_m, 0.5) / 3.5)
    rain_factor = min(rainfall_24h_mm / 180.0, 1.5)
    proximity_factor = 1.0 if distance_to_river_m <= 100 else math.exp(-(distance_to_river_m - 100) / 400.0)
    
    score = (0.50 * hand_factor + 0.30 * (rain_factor / 1.5) + 0.20 * proximity_factor) * min(rain_factor, 1.0)
    return round(min(max(score, 0.0), 1.0), 4)

def compute_cloudburst_hazard(slope_deg: float, rainfall_24h_mm: float, elevation_m: float) -> float:
    """
    Computes cloudburst & flash debris runoff hazard (0.0 to 1.0).
    Occurs where intense orographic precipitation triggers slope wash.
    """
    if rainfall_24h_mm >= 200.0:
        base = 0.90 + 0.10 * min((rainfall_24h_mm - 200.0) / 100.0, 1.0)
    else:
        base = rainfall_24h_mm / 200.0

    # Orographic slope enhancement
    slope_enhancement = min(slope_deg / 35.0, 1.2)
    score = base * (0.7 + 0.3 * slope_enhancement)
    return round(min(max(score, 0.0), 1.0), 4)

def compute_hazard_suite(habitation_data: Dict[str, Any], rainfall_override: float = None) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Computes all hazard subscores and produces the composite hazard index.
    """
    terrain = habitation_data["terrain"]
    rainfall = rainfall_override if rainfall_override is not None else habitation_data.get("current_rainfall_24h_mm", 100.0)

    # 1. Landslide (ML Model)
    ml_features = {
        "slope_deg": terrain["slope_deg"],
        "elevation_m": terrain["elevation_m"],
        "twi": terrain["twi"],
        "distance_to_road_cut_m": terrain["distance_to_road_cut_m"],
        "distance_to_river_m": terrain["distance_to_river_m"],
        "rainfall_24h_mm": rainfall
    }
    landslide_score, top_factors = ml_model.predict_susceptibility(ml_features)

    # 2. Flood (HAND Hydrology)
    flood_score = compute_flood_hazard(
        hand_m=terrain["hand_m"],
        rainfall_24h_mm=rainfall,
        distance_to_river_m=terrain["distance_to_river_m"]
    )

    # 3. Cloudburst / Runoff
    cloudburst_score = compute_cloudburst_hazard(
        slope_deg=terrain["slope_deg"],
        rainfall_24h_mm=rainfall,
        elevation_m=terrain["elevation_m"]
    )

    # 4. Max-Rule-Plus-Residual Composite Combination (PRD §5)
    w_ls = HAZARD_CONFIG["WEIGHT_LANDSLIDE"]
    w_fl = HAZARD_CONFIG["WEIGHT_FLOOD"]
    w_cb = HAZARD_CONFIG["WEIGHT_CLOUDBURST"]
    lam = HAZARD_CONFIG["MAX_RULE_RESIDUAL_LAMBDA"]

    weighted_scores = [
        (w_ls * landslide_score, "Landslide", landslide_score),
        (w_fl * flood_score, "Flood", flood_score),
        (w_cb * cloudburst_score, "Cloudburst", cloudburst_score)
    ]
    weighted_scores.sort(key=lambda x: x[0], reverse=True)

    max_weighted = weighted_scores[0][0]
    residual_sum = sum(score[0] for score in weighted_scores[1:])
    composite_index = min(1.0, max_weighted + lam * residual_sum)

    scores = {
        "landslide_score": landslide_score,
        "flood_score": flood_score,
        "cloudburst_score": cloudburst_score,
        "composite_hazard_index": round(composite_index, 4)
    }

    metadata = {
        "primary_hazard_driver": weighted_scores[0][1],
        "top_terrain_factors": top_factors,
        "active_rainfall_mm": rainfall
    }

    return scores, metadata
