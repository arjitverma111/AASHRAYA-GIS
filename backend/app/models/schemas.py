"""
Pydantic Schemas for AASHRAYA-GIS
Ensures strict type-safety, validation, and transparent JSON responses.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# --- Habitation Demographics & Terrain ---
class Demographics(BaseModel):
    elderly_pct: float
    children_pct: float
    disabled_pct: float
    kutcha_housing_pct: float
    poverty_bpl_pct: float
    livelihood_farming_pct: float

class InfrastructureDistances(BaseModel):
    nearest_hospital: float
    all_weather_road: float
    police_fire_station: float

class TerrainMetrics(BaseModel):
    elevation_m: float
    slope_deg: float
    aspect_deg: float
    hand_m: float
    twi: float
    land_cover: str
    distance_to_river_m: float
    distance_to_road_cut_m: float

# --- Assessment Output Models ---
class HazardScores(BaseModel):
    landslide_score: float = Field(..., description="0-1 susceptibility from ML classifier & terrain")
    flood_score: float = Field(..., description="0-1 hazard from HAND hydrology + rainfall")
    cloudburst_score: float = Field(..., description="0-1 extreme precipitation hazard")
    composite_hazard_index: float = Field(..., description="0-1 max-rule-plus-residual index")
    top_terrain_factors: List[Dict[str, Any]] = Field(default_factory=list)

class VulnerabilityBreakdown(BaseModel):
    vulnerability_index: float = Field(..., description="0-1 composite vulnerability score")
    factors: Dict[str, float] = Field(..., description="Inspectable component contributions")

class RiskAssessment(BaseModel):
    composite_risk: float = Field(..., description="0-100 normalized composite risk")
    risk_band: str = Field(..., description="RED, ORANGE, WATCH, GREEN")
    hazard_component: float
    exposure_component: float
    vulnerability_component: float
    historical_component: float
    contributing_factors: Dict[str, float]
    human_readable_explanation: str
    confidence: float

class RelocationPriority(BaseModel):
    priority_score: float = Field(..., description="0-1 urgency index")
    priority_tier: str = Field(..., description="IMMEDIATE, SHORT_TERM, MEDIUM_TERM, MONITOR")
    rationale: str
    recommended_action: str

class Habitation(BaseModel):
    id: str
    name: str
    panchayat: str
    tehsil: str
    district: str
    state: str
    latitude: float
    longitude: float
    population: int
    households: int
    demographics: Demographics
    infrastructure_distances_km: InfrastructureDistances
    historical_disasters_10y: int
    terrain: TerrainMetrics
    current_rainfall_24h_mm: float
    data_vintage: str
    confidence: float
    # Computed decision fields
    hazards: Optional[HazardScores] = None
    vulnerability: Optional[VulnerabilityBreakdown] = None
    risk: Optional[RiskAssessment] = None
    priority: Optional[RelocationPriority] = None
    approval_status: Optional[str] = "PENDING_REVIEW"
    assigned_site_id: Optional[str] = None

# --- Candidate Relocation Sites ---
class SiteCapacities(BaseModel):
    land_capacity: int
    water_capacity: int
    power_capacity: int
    health_capacity: int
    school_capacity: int

class CandidateSite(BaseModel):
    id: str
    name: str
    panchayat: str
    tehsil: str
    district: str
    latitude: float
    longitude: float
    usable_area_ha: float
    existing_population: int
    capacities: SiteCapacities
    safety_score: float
    infra_access_score: float
    socioeconomic_score: float
    environmental_constraint_flag: float
    is_inside_hazard_zone: bool
    is_protected_eco_area: bool
    status: str
    water_supply_source: str
    road_access_class: str
    electricity_feeder: str
    nearest_phc_distance_km: float
    nearest_school_distance_km: float
    data_vintage: str
    # Computed carrying capacity fields
    raw_bottleneck_capacity: Optional[int] = None
    effective_capacity: Optional[int] = None
    available_capacity: Optional[int] = None
    binding_constraint: Optional[str] = None
    capacity_breakdown: Optional[Dict[str, int]] = None
    allocated_population: int = 0

# --- Optimization & Allocations ---
class AllocationAssignment(BaseModel):
    village_id: str
    village_name: str
    population: int
    urgency_tier: str
    site_id: Optional[str]
    site_name: Optional[str]
    distance_km: Optional[float]
    site_safety_score: Optional[float]
    remaining_site_capacity: Optional[int]
    status: str = Field(..., description="OPTIMAL_ASSIGNED or ESCALATE_INFEASIBLE")
    reason: str
    route_coordinates: Optional[List[List[float]]] = None

class OptimizationRequest(BaseModel):
    habitation_ids: Optional[List[str]] = None
    tier_filter: Optional[str] = None # e.g. "IMMEDIATE" or "ALL_PRIORITY"
    safety_margin: float = 0.85

class OptimizationResponse(BaseModel):
    status: str
    total_habitations_considered: int
    total_population_relocated: int
    assigned_count: int
    escalated_count: int
    solver_status: str
    assignments: List[AllocationAssignment]
    execution_time_ms: float

# --- Human-in-the-Loop Governance ---
class ApprovalRequest(BaseModel):
    habitation_id: str
    action: str = Field(..., description="APPROVE, OVERRIDE, REQUEST_DATA")
    operator_role: str = Field(..., description="State DMA, District DMA, GIS Analyst")
    operator_name: str
    justification: str
    overridden_site_id: Optional[str] = None

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    habitation_id: str
    habitation_name: str
    action: str
    operator_role: str
    operator_name: str
    justification: str
    overridden_site_id: Optional[str] = None
    previous_tier: Optional[str] = None
    new_tier: Optional[str] = None

# --- Live Dynamic Simulation ---
class SimulationRequest(BaseModel):
    rainfall_increment_mm: float = Field(..., description="Additional 24h rainfall in mm (e.g. 100-250mm)")
    target_panchayats: Optional[List[str]] = None

class SimulationResponse(BaseModel):
    simulation_active: bool
    injected_rainfall_mm: float
    affected_habitations_count: int
    escalated_to_immediate_count: int
    escalated_villages: List[Dict[str, Any]]
    generated_alerts: List[Dict[str, Any]]
    timestamp: str

# --- Dashboard & KPI Overview ---
class DashboardOverview(BaseModel):
    total_habitations_assessed: int
    critical_immediate_count: int
    short_term_count: int
    medium_term_count: int
    monitor_count: int
    red_zone_habitations_count: int
    total_population_exposed: int
    population_requiring_relocation: int
    total_safe_capacity_available: int
    candidate_sites_count: int
    active_alerts: List[Dict[str, Any]]
    hazard_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    system_status: Dict[str, str]
    current_simulation_state: Dict[str, Any]
