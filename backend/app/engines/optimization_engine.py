"""
Optimization Engine
Mixed-Integer Linear Programming (MILP) Solver using PuLP.
Solves the Village-to-Site Relocation Assignment problem under multi-dimensional
carrying capacity limits, distance constraints, and safety objectives (PRD §10, FR-14, FR-15, FR-16).
"""
import time
from typing import List, Dict, Any, Tuple
import pulp
from app.config import OPTIMIZATION_CONFIG
from app.engines.relocation_engine import compute_haversine_distance

def solve_relocation_allocation(
    habitations: List[Dict[str, Any]],
    candidate_sites: List[Dict[str, Any]],
    safety_margin: float = 0.85
) -> Dict[str, Any]:
    """
    Formulates and solves the MILP allocation problem:
    Assigns prioritized habitations to candidate relocation sites to minimize
    distance, hazard exposure, and disruption subject to hard carrying capacity constraints.
    """
    start_time = time.time()
    cfg = OPTIMIZATION_CONFIG
    max_dist = cfg["MAX_RELOCATION_DISTANCE_KM"]

    # Filter out hard-excluded candidate sites (safety guardrail)
    valid_sites = [
        s for s in candidate_sites
        if not s.get("is_inside_hazard_zone", False)
        and not s.get("is_protected_eco_area", False)
        and s.get("available_capacity", 0) > 0
    ]

    if not habitations:
        return {
            "status": "NO_HABITATIONS_PROVIDED",
            "total_habitations_considered": 0,
            "total_population_relocated": 0,
            "assigned_count": 0,
            "escalated_count": 0,
            "solver_status": "EMPTY",
            "assignments": [],
            "execution_time_ms": 0.0
        }

    # If no valid sites available at all, escalate all
    if not valid_sites:
        escalated_assignments = []
        for h in habitations:
            escalated_assignments.append({
                "village_id": h["id"],
                "village_name": h["name"],
                "population": h["population"],
                "urgency_tier": h.get("priority", {}).get("priority_tier", "IMMEDIATE"),
                "site_id": None,
                "site_name": None,
                "distance_km": None,
                "site_safety_score": None,
                "remaining_site_capacity": None,
                "status": "ESCALATE_INFEASIBLE",
                "reason": "Escalate to State Authority — No qualified candidate sites available outside hazard zones."
            })
        return {
            "status": "ALL_ESCALATED",
            "total_habitations_considered": len(habitations),
            "total_population_relocated": 0,
            "assigned_count": 0,
            "escalated_count": len(habitations),
            "solver_status": "NO_VALID_SITES",
            "assignments": escalated_assignments,
            "execution_time_ms": round((time.time() - start_time) * 1000, 2)
        }

    # Precalculate distance and cost matrix
    costs = {}
    distances = {}
    feasible_pairs = []

    for h in habitations:
        h_id = h["id"]
        for s in valid_sites:
            s_id = s["id"]
            d = compute_haversine_distance(h["latitude"], h["longitude"], s["latitude"], s["longitude"])
            distances[(h_id, s_id)] = d

            if d <= max_dist:
                feasible_pairs.append((h_id, s_id))
                # Normalized cost components
                c_dist = cfg["WEIGHT_DISTANCE"] * (d / max_dist)
                c_safety = cfg["WEIGHT_SAFETY"] * (1.0 - s.get("safety_score", 0.9))
                c_infra = cfg["WEIGHT_INFRASTRUCTURE"] * (1.0 - s.get("infra_access_score", 0.9))
                # Livelihood disruption: farming populations moving farther suffer higher friction
                farming_pct = h.get("demographics", {}).get("livelihood_farming_pct", 0.5)
                c_disrupt = cfg["WEIGHT_LIVELIHOOD_DISRUPTION"] * (farming_pct * (d / max_dist))

                costs[(h_id, s_id)] = c_dist + c_safety + c_infra + c_disrupt

    # PuLP MILP Problem Formulation
    prob = pulp.LpProblem("Habitation_Relocation_Assignment", pulp.LpMinimize)

    # Decision variables: x[i, j] = 1 if village i is assigned to site j
    x = {}
    for (h_id, s_id) in feasible_pairs:
        x[(h_id, s_id)] = pulp.LpVariable(f"x_{h_id}_{s_id}", cat=pulp.LpBinary)

    # Slack variables: u[i] = 1 if village i cannot be assigned (escalated)
    u = {}
    for h in habitations:
        u[h["id"]] = pulp.LpVariable(f"u_{h['id']}", cat=pulp.LpBinary)

    # Objective Function: Minimize weighted total cost + high penalty for leaving village unassigned
    prob += (
        pulp.lpSum([costs[(h_id, s_id)] * x[(h_id, s_id)] for (h_id, s_id) in feasible_pairs])
        + pulp.lpSum([1000.0 * u[h["id"]] for h in habitations])
    )

    # Constraint 1: Each village MUST either be assigned to exactly one feasible site OR escalated (u=1)
    for h in habitations:
        h_id = h["id"]
        applicable_vars = [x[(h_id, s["id"])] for s in valid_sites if (h_id, s["id"]) in x]
        prob += pulp.lpSum(applicable_vars) + u[h_id] == 1

    # Constraint 2: Site Capacity cannot be exceeded
    for s in valid_sites:
        s_id = s["id"]
        site_cap = s.get("available_capacity", 0)
        allocated_terms = [
            h["population"] * x[(h["id"], s_id)]
            for h in habitations
            if (h["id"], s_id) in x
        ]
        if allocated_terms:
            prob += pulp.lpSum(allocated_terms) <= site_cap

    # Solve MILP with CBC Solver
    solver = pulp.PULP_CBC_CMD(msg=0)
    prob.solve(solver)
    solver_status = pulp.LpStatus[prob.status]

    # Process Assignments
    site_remaining_capacity = {s["id"]: s.get("available_capacity", 0) for s in valid_sites}
    site_lookup = {s["id"]: s for s in valid_sites}
    assignments = []
    total_relocated = 0
    assigned_count = 0
    escalated_count = 0

    for h in habitations:
        h_id = h["id"]
        assigned_site_id = None

        # Check if solver assigned this village
        for s in valid_sites:
            s_id = s["id"]
            if (h_id, s_id) in x and pulp.value(x[(h_id, s_id)]) == 1.0:
                assigned_site_id = s_id
                break

        if assigned_site_id:
            site = site_lookup[assigned_site_id]
            dist = distances[(h_id, assigned_site_id)]
            pop = h["population"]
            site_remaining_capacity[assigned_site_id] -= pop
            total_relocated += pop
            assigned_count += 1

            assignments.append({
                "village_id": h_id,
                "village_name": h["name"],
                "population": pop,
                "urgency_tier": h.get("priority", {}).get("priority_tier", "IMMEDIATE"),
                "site_id": assigned_site_id,
                "site_name": site["name"],
                "distance_km": dist,
                "site_safety_score": site.get("safety_score", 0.95),
                "remaining_site_capacity": site_remaining_capacity[assigned_site_id],
                "status": "OPTIMAL_ASSIGNED",
                "reason": (
                    f"Optimal assignment to {site['name']} ({dist:.1f} km, Safety: {int(site.get('safety_score', 0.95)*100)}%). "
                    f"Site accommodates {pop:,} residents with {site_remaining_capacity[assigned_site_id]:,} headroom remaining."
                ),
                "route_coordinates": [
                    [h["latitude"], h["longitude"]],
                    [site["latitude"], site["longitude"]]
                ]
            })
        else:
            escalated_count += 1
            # Infeasibility diagnosis
            # Check if distance was the issue or capacity was the issue
            nearby_sites = [s for s in valid_sites if distances.get((h_id, s["id"]), 999) <= max_dist]
            if not nearby_sites:
                reason = f"No candidate site located within the {max_dist} km operational radius. Requires inter-district coordination."
            else:
                reason = f"Nearby candidate sites have insufficient remaining carrying capacity for {h['population']:,} people. Escalate for emergency expansion."

            assignments.append({
                "village_id": h_id,
                "village_name": h["name"],
                "population": h["population"],
                "urgency_tier": h.get("priority", {}).get("priority_tier", "IMMEDIATE"),
                "site_id": None,
                "site_name": None,
                "distance_km": None,
                "site_safety_score": None,
                "remaining_site_capacity": None,
                "status": "ESCALATE_INFEASIBLE",
                "reason": reason,
                "route_coordinates": None
            })

    execution_time = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "COMPLETED",
        "total_habitations_considered": len(habitations),
        "total_population_relocated": total_relocated,
        "assigned_count": assigned_count,
        "escalated_count": escalated_count,
        "solver_status": solver_status,
        "assignments": assignments,
        "execution_time_ms": execution_time
    }
