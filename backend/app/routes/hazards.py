"""
Hazards Route
Serves GeoJSON multi-hazard layers, red zones, and historical event catalogs (PRD §14, §15).
"""
from fastapi import APIRouter
from app.data.data_store import db

router = APIRouter(prefix="/api/hazards", tags=["Hazards"])

@router.get("/layers")
def get_hazard_layers_geojson():
    """Returns GeoJSON polygon feature collection of all active hazard zones."""
    return db.hazard_geojson

@router.get("/summary")
def get_hazard_summary():
    """Returns historical disaster catalog and terrain metadata."""
    return {
        "region": "Wayanad District, Western Ghats, Kerala",
        "primary_geological_formation": "Charnockite and Gneiss with deep weathered lateritic overburden",
        "historical_disasters_catalog": db.historical_disasters,
        "hazard_layers_count": len(db.hazard_geojson.get("features", []))
    }
