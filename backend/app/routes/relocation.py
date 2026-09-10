"""
Relocation Route
Provides candidate sites retrieval, MILP allocation optimization,
and human-in-the-loop decision approvals (PRD §10, FR-10 to FR-19).
"""
import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from app.data.data_store import db
from app.models.schemas import OptimizationRequest, OptimizationResponse, ApprovalRequest, AuditLogEntry
from app.engines.optimization_engine import solve_relocation_allocation

router = APIRouter(prefix="/api/relocation", tags=["Relocation"])

@router.get("/sites")
def list_candidate_sites(include_excluded: bool = True):
    """
    Lists candidate relocation sites with raw, bottleneck, and available carrying capacity figures.
    """
    sites = db.candidate_sites
    if not include_excluded:
        sites = [s for s in sites if not s.get("is_inside_hazard_zone", False) and not s.get("is_protected_eco_area", False)]
    return {
        "count": len(sites),
        "candidate_sites": sites
    }

@router.post("/optimize", response_model=OptimizationResponse)
def run_optimization(payload: OptimizationRequest):
    """
    Mixed-Integer Linear Programming (MILP) Solver:
    Computes provably optimal village-to-site assignments subject to capacity limits.
    """
    # Select habitations
    if payload.habitation_ids:
        target_habitations = [h for h in db.habitations if h["id"] in payload.habitation_ids]
    elif payload.tier_filter:
        target_habitations = [
            h for h in db.habitations
            if h.get("priority", {}).get("priority_tier") == payload.tier_filter.upper()
        ]
    else:
        # Default: all IMMEDIATE and SHORT_TERM habitations
        target_habitations = [
            h for h in db.habitations
            if h.get("priority", {}).get("priority_tier") in ["IMMEDIATE", "SHORT_TERM"]
        ]

    # Run MILP solver
    optimization_result = solve_relocation_allocation(
        habitations=target_habitations,
        candidate_sites=db.candidate_sites,
        safety_margin=payload.safety_margin
    )

    db.last_optimization_result = optimization_result

    # Update in-memory assigned site IDs for habitations
    for assign in optimization_result["assignments"]:
        if assign.get("site_id"):
            h = db.get_habitation_by_id(assign["village_id"])
            if h:
                h["assigned_site_id"] = assign["site_id"]

    return optimization_result

@router.post("/approve")
def submit_human_decision(payload: ApprovalRequest):
    """
    Human-in-the-Loop Governance:
    State/District DM official approves, overrides, or requests data.
    Logged to immutable audit trail (FR-18, FR-19).
    """
    h = db.get_habitation_by_id(payload.habitation_id)
    if not h:
        raise HTTPException(status_code=404, detail=f"Habitation '{payload.habitation_id}' not found.")

    previous_tier = h.get("priority", {}).get("priority_tier")
    h["approval_status"] = payload.action

    if payload.action == "OVERRIDE" and payload.overridden_site_id:
        target_site = db.get_site_by_id(payload.overridden_site_id)
        if not target_site:
            raise HTTPException(status_code=400, detail=f"Invalid override site '{payload.overridden_site_id}'.")
        h["assigned_site_id"] = payload.overridden_site_id

    now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    audit_entry = {
        "id": f"AUD_{int(datetime.datetime.now().timestamp() * 1000)}",
        "timestamp": now_iso,
        "habitation_id": h["id"],
        "habitation_name": h["name"],
        "action": payload.action,
        "operator_role": payload.operator_role,
        "operator_name": payload.operator_name,
        "justification": payload.justification,
        "overridden_site_id": payload.overridden_site_id,
        "previous_tier": previous_tier,
        "new_tier": previous_tier
    }

    db.add_audit_log(audit_entry)

    return {
        "status": "RECORDED",
        "message": f"Action '{payload.action}' successfully logged to audit trail.",
        "audit_entry": audit_entry
    }
