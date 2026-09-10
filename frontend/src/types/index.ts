export type UserRole = "District DMA" | "State DMA" | "GIS Analyst";

export interface Demographics {
  elderly_pct: number;
  children_pct: number;
  disabled_pct: number;
  kutcha_housing_pct: number;
  poverty_bpl_pct: number;
  livelihood_farming_pct: number;
}

export interface InfrastructureDistances {
  nearest_hospital: number;
  all_weather_road: number;
  police_fire_station: number;
}

export interface TerrainMetrics {
  elevation_m: number;
  slope_deg: number;
  aspect_deg: number;
  hand_m: number;
  twi: number;
  land_cover: string;
  distance_to_river_m: number;
  distance_to_road_cut_m: number;
}

export interface HazardFactor {
  feature: string;
  importance_weight: number;
  feature_value: number;
  description: string;
}

export interface HazardScores {
  landslide_score: number;
  flood_score: number;
  cloudburst_score: number;
  composite_hazard_index: number;
  top_terrain_factors?: HazardFactor[];
}

export interface VulnerabilityBreakdown {
  vulnerability_index: number;
  factors: Record<string, number>;
}

export interface RiskAssessment {
  composite_risk: number;
  risk_band: "RED" | "ORANGE" | "WATCH" | "GREEN";
  hazard_component: number;
  exposure_component: number;
  vulnerability_component: number;
  historical_component: number;
  contributing_factors: {
    hazard_contribution_pct: number;
    population_exposure_pct: number;
    vulnerability_pct: number;
    disaster_history_pct: number;
  };
  human_readable_explanation: string;
  confidence: number;
}

export interface RelocationPriority {
  priority_score: number;
  priority_tier: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "MONITOR";
  rationale: string;
  recommended_action: string;
  is_catastrophic_hazard_override?: boolean;
}

export interface Habitation {
  id: string;
  name: string;
  panchayat: string;
  tehsil: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  population: number;
  households: number;
  demographics: Demographics;
  infrastructure_distances_km: InfrastructureDistances;
  historical_disasters_10y: number;
  terrain: TerrainMetrics;
  current_rainfall_24h_mm: number;
  data_vintage: string;
  confidence: number;
  hazards?: HazardScores;
  vulnerability?: VulnerabilityBreakdown;
  risk?: RiskAssessment;
  priority?: RelocationPriority;
  approval_status?: string;
  assigned_site_id?: string | null;
}

export interface SiteCapacities {
  land_capacity: number;
  water_capacity: number;
  power_capacity: number;
  health_capacity: number;
  school_capacity: number;
}

export interface CandidateSite {
  id: string;
  name: string;
  panchayat: string;
  tehsil: string;
  district: string;
  latitude: number;
  longitude: number;
  usable_area_ha: number;
  existing_population: number;
  capacities: SiteCapacities;
  safety_score: number;
  infra_access_score: number;
  socioeconomic_score: number;
  environmental_constraint_flag: number;
  is_inside_hazard_zone: boolean;
  is_protected_eco_area: boolean;
  status: string;
  water_supply_source: string;
  road_access_class: string;
  electricity_feeder: string;
  nearest_phc_distance_km: number;
  nearest_school_distance_km: number;
  data_vintage: string;
  raw_bottleneck_capacity?: number;
  effective_capacity?: number;
  available_capacity?: number;
  binding_constraint?: string;
  capacity_breakdown?: Record<string, number>;
  allocated_population?: number;
}

export interface AllocationAssignment {
  village_id: string;
  village_name: string;
  population: number;
  urgency_tier: string;
  site_id: string | null;
  site_name: string | null;
  distance_km: number | null;
  site_safety_score: number | null;
  remaining_site_capacity: number | null;
  status: "OPTIMAL_ASSIGNED" | "ESCALATE_INFEASIBLE";
  reason: string;
  route_coordinates?: [number, number][] | null;
}

export interface OptimizationResponse {
  status: string;
  total_habitations_considered: number;
  total_population_relocated: number;
  assigned_count: number;
  escalated_count: number;
  solver_status: string;
  assignments: AllocationAssignment[];
  execution_time_ms: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  habitation_id: string;
  habitation_name: string;
  panchayat: string;
  message: string;
  action_required: string;
}

export interface DashboardOverview {
  total_habitations_assessed: number;
  critical_immediate_count: number;
  short_term_count: number;
  medium_term_count: number;
  monitor_count: number;
  red_zone_habitations_count: number;
  total_population_exposed: number;
  population_requiring_relocation: number;
  total_safe_capacity_available: number;
  candidate_sites_count: number;
  active_alerts: AlertItem[];
  hazard_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  system_status: Record<string, string>;
  current_simulation_state: {
    is_active: boolean;
    injected_rainfall_mm: number;
    simulated_timestamp: string | null;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  habitation_id: string;
  habitation_name: string;
  action: string;
  operator_role: string;
  operator_name: string;
  justification: string;
  overridden_site_id: string | null;
  previous_tier: string | null;
  new_tier: string | null;
}
