"""
Audit Route
Provides access to the immutable human-governance decision audit log (PRD §16, §20, FR-18, FR-19).
"""
from fastapi import APIRouter
from app.data.data_store import db

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("/logs")
def get_audit_logs():
    """Returns chronologically ordered audit logs of administrative actions."""
    return {
        "total_records": len(db.audit_log),
        "logs": db.audit_log
    }
