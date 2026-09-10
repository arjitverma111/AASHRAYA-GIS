"""
AASHRAYA-GIS Command Center Backend API
Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment,
and Immediate Relocation Needs for Vulnerable Habitations.

Authority: NDRF (DM Division), Ministry of Home Affairs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.dashboard import router as dashboard_router
from app.routes.habitations import router as habitations_router
from app.routes.hazards import router as hazards_router
from app.routes.relocation import router as relocation_router
from app.routes.simulation import router as simulation_router
from app.routes.analytics import router as analytics_router
from app.routes.audit import router as audit_router

app = FastAPI(
    title="AASHRAYA-GIS Decision Support Platform",
    description="Intelligent Multi-Hazard Red-Zone, Carrying-Capacity & Relocation Command Center (NDRF / MHA PS-26191)",
    version="1.0.0"
)

# Enable CORS for frontend development and local demonstration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(dashboard_router)
app.include_router(habitations_router)
app.include_router(hazards_router)
app.include_router(relocation_router)
app.include_router(simulation_router)
app.include_router(analytics_router)
app.include_router(audit_router)

@app.get("/")
def root():
    return {
        "system": "AASHRAYA-GIS Command Center",
        "status": "OPERATIONAL",
        "authority": "NDRF / Ministry of Home Affairs (DM Division)",
        "demo_district": "Wayanad, Kerala",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "engines": {
            "gis": "ONLINE",
            "ml_susceptibility": "ONLINE",
            "risk_engine": "ONLINE",
            "capacity_engine": "ONLINE",
            "optimization_milp": "ONLINE",
            "simulation": "ONLINE"
        }
    }
