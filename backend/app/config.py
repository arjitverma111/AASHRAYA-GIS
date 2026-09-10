"""
AASHRAYA-GIS Configuration & Parameters
Contains official Indian planning norms, weighting parameters, and decision thresholds.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# Indian Planning Norms
PLANNING_NORMS = {
    "RURAL_DENSITY_PER_HA": 125,               # Persons per hectare (rural resilient township norm)
    "WATER_LPCD": 100,                          # Litres Per Capita per Day (Jal Jeevan Mission / MoHUA norm)
    "POWER_KW_PER_HOUSEHOLD": 0.5,             # Average rural electricity connected load
    "PERSONS_PER_HOUSEHOLD": 4.5,              # Census average rural household size
    "PHC_POPULATION_NORM": 30000,              # Primary Health Centre capacity threshold
    "CLASSROOM_STUDENT_NORM": 40,              # RTE norm students per classroom
    "DEMOGRAPHIC_SCHOOL_AGE_PCT": 0.18,        # Percentage of population of school-going age
    "DEFAULT_SAFETY_MARGIN": 0.85              # 15% capacity buffer to prevent resource exhaustion
}

# Multi-Hazard Weights & Max-Rule Parameters (PRD §5)
HAZARD_CONFIG = {
    "WEIGHT_LANDSLIDE": 0.40,
    "WEIGHT_FLOOD": 0.35,
    "WEIGHT_CLOUDBURST": 0.25,
    "MAX_RULE_RESIDUAL_LAMBDA": 0.15           # Residual multiplier so secondary hazards still elevate score
}

# Composite Risk Calculation Weights (UNDRR Formulation: Risk = Hazard x Exposure x Vulnerability)
RISK_CONFIG = {
    "WEIGHT_HAZARD": 0.40,
    "WEIGHT_EXPOSURE": 0.25,
    "WEIGHT_VULNERABILITY": 0.20,
    "WEIGHT_HISTORY": 0.15,
    # Thresholds for Red-Zone Classification
    "RED_ZONE_THRESHOLD": 70.0,
    "ORANGE_ZONE_THRESHOLD": 50.0,
    "WATCH_ZONE_THRESHOLD": 30.0,
    "SINGLE_HAZARD_RED_OVERRIDE": 0.85          # If any single hazard >= 0.85, force Red Zone
}

# Vulnerability Index Weights (Census Proxies)
VULNERABILITY_CONFIG = {
    "WEIGHT_ELDERLY": 0.15,
    "WEIGHT_CHILDREN": 0.15,
    "WEIGHT_DISABLED": 0.15,
    "WEIGHT_KUTCHA_HOUSING": 0.20,
    "WEIGHT_POVERTY_BPL": 0.15,
    "WEIGHT_HOSPITAL_DISTANCE": 0.10,
    "WEIGHT_ROAD_DISTANCE": 0.10
}

# Relocation Urgency Priority Weights (PRD §7)
PRIORITY_CONFIG = {
    "WEIGHT_HAZARD_SEVERITY": 0.35,
    "WEIGHT_VULNERABILITY": 0.25,
    "WEIGHT_EXPOSURE": 0.20,
    "WEIGHT_DISASTER_HISTORY": 0.10,
    "WEIGHT_SAFE_SITE_ACCESSIBILITY": 0.10,
    # Action Tiers
    "TIER_IMMEDIATE_THRESHOLD": 0.75,
    "TIER_SHORT_TERM_THRESHOLD": 0.50,
    "TIER_MEDIUM_TERM_THRESHOLD": 0.30,
    "HAZARD_IMMEDIATE_OVERRIDE": 0.90          # If single hazard >= 0.90, force IMMEDIATE tier
}

# Optimization Engine Objective Weights (MILP)
OPTIMIZATION_CONFIG = {
    "WEIGHT_DISTANCE": 0.35,
    "WEIGHT_SAFETY": 0.35,
    "WEIGHT_INFRASTRUCTURE": 0.15,
    "WEIGHT_LIVELIHOOD_DISRUPTION": 0.15,
    "MAX_RELOCATION_DISTANCE_KM": 35.0         # Hard cutoff distance for regional reallocation
}
