"""
Habitations Route
Provides list and detail queries for assessed villages,
including factor-level explainability and status updates (PRD §18, Page 3).
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.data.data_store import db
from app.engines.capacity_engine import score_site_suitability
from app.engines.relocation_engine import compute_haversine_distance

router = APIRouter(prefix="/api/habitations", tags=["Habitations"])

@router.get("")
def list_habitations(
    panchayat: Optional[str] = Query(None, description="Filter by panchayat"),
    tehsil: Optional[str] = Query(None, description="Filter by tehsil"),
    risk_band: Optional[str] = Query(None, description="Filter by RED, ORANGE, WATCH, GREEN"),
    priority_tier: Optional[str] = Query(None, description="Filter by IMMEDIATE, SHORT_TERM, MEDIUM_TERM, MONITOR")
):
    results = db.habitations

    if panchayat:
        results = [h for h in results if h.get("panchayat", "").lower() == panchayat.lower()]
    if tehsil:
        results = [h for h in results if h.get("tehsil", "").lower() == tehsil.lower()]
    if risk_band:
        results = [h for h in results if h.get("risk", {}).get("risk_band", "").upper() == risk_band.upper()]
    if priority_tier:
        results = [h for h in results if h.get("priority", {}).get("priority_tier", "").upper() == priority_tier.upper()]

    # Sort primarily by Priority Score descending, then by Risk Score descending
    sorted_results = sorted(
        results,
        key=lambda x: (
            x.get("priority", {}).get("priority_score", 0.0),
            x.get("risk", {}).get("composite_risk", 0.0)
        ),
        reverse=True
    )

    return {
        "count": len(sorted_results),
        "habitations": sorted_results
    }

@router.get("/{habitation_id}")
def get_habitation_detail(habitation_id: str):
    h = db.get_habitation_by_id(habitation_id)
    if not h:
        raise HTTPException(status_code=404, detail=f"Habitation with id '{habitation_id}' not found.")

    # Find Top 3 Candidate Sites for this village with distances and suitability scores
    valid_sites = [s for s in db.candidate_sites if not s.get("is_inside_hazard_zone", False) and not s.get("is_protected_eco_area", False)]
    site_evals = []

    for s in valid_sites:
        dist = compute_haversine_distance(h["latitude"], h["longitude"], s["latitude"], s["longitude"])
        suitability_score, factor_breakdown = score_site_suitability(s, distance_km=dist)
        site_evals.append({
            "site_id": s["id"],
            "site_name": s["name"],
            "panchayat": s["panchayat"],
            "distance_km": dist,
            "safety_score": s.get("safety_score", 0.95),
            "suitability_score": suitability_score,
            "effective_capacity": s.get("effective_capacity", 0),
            "available_capacity": s.get("available_capacity", 0),
            "binding_constraint": s.get("binding_constraint", "N/A"),
            "road_access": s.get("road_access_class", "Paved")
        })

    # Sort candidate sites by suitability descending
    site_evals.sort(key=lambda x: x["suitability_score"], reverse=True)

    return {
        "habitation": h,
        "recommended_candidate_sites": site_evals[:3],
        "audit_history": [entry for entry in db.audit_log if entry.get("habitation_id") == habitation_id]
    }
