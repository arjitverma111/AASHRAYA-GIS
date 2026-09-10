"""
Test Suite: End-to-End FastAPI Endpoints
Tests all primary API routes for status codes and contract payloads.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "OPERATIONAL"

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "HEALTHY"

def test_dashboard_endpoint():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_habitations_assessed"] >= 20
    assert "critical_immediate_count" in data
    assert "active_alerts" in data
    assert data["system_status"]["gis_engine"].startswith("ONLINE")

def test_habitations_list_and_detail():
    res = client.get("/api/habitations")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 20
    first_id = data["habitations"][0]["id"]

    res_detail = client.get(f"/api/habitations/{first_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert "habitation" in detail
    assert "recommended_candidate_sites" in detail
    assert len(detail["recommended_candidate_sites"]) > 0

def test_hazard_layers_geojson():
    res = client.get("/api/hazards/layers")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

def test_relocation_sites_and_optimization():
    res_sites = client.get("/api/relocation/sites")
    assert res_sites.status_code == 200
    assert res_sites.json()["count"] >= 5

    res_opt = client.post("/api/relocation/optimize", json={"tier_filter": "IMMEDIATE"})
    assert res_opt.status_code == 200
    opt_data = res_opt.json()
    assert opt_data["status"] == "COMPLETED"
    assert len(opt_data["assignments"]) > 0

def test_simulation_workflow():
    # Trigger heavy rain
    res_sim = client.post("/api/simulation/heavy-rainfall", json={"rainfall_increment_mm": 150.0})
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["simulation_active"] is True
    assert len(sim_data["generated_alerts"]) > 0

    # Reset
    res_rst = client.post("/api/simulation/reset")
    assert res_rst.status_code == 200
    assert res_rst.json()["status"] == "RESET_SUCCESSFUL"

def test_audit_logging_flow():
    # Submit human approval
    res_appr = client.post("/api/relocation/approve", json={
        "habitation_id": "VIL_001",
        "action": "APPROVE",
        "operator_role": "District Disaster Management Officer",
        "operator_name": "Meena IAS",
        "justification": "Approved following field inspection and verification of Kalpetta relief capacity."
    })
    assert res_appr.status_code == 200

    # Check audit log
    res_audit = client.get("/api/audit/logs")
    assert res_audit.status_code == 200
    assert res_audit.json()["total_records"] > 0
