from pathlib import Path
import sys

import pandas as pd
import streamlit as st


ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

from app.data.data_store import db
from app.models.schemas import SimulationRequest
from app.routes.dashboard import get_dashboard_summary
from app.routes.simulation import inject_heavy_rainfall, reset_simulation


st.set_page_config(
    page_title="AASHRAYA-GIS Command Center",
    page_icon=":triangular_flag_on_post:",
    layout="wide",
)


def habitation_table() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Habitation": habitation["name"],
                "Panchayat": habitation["panchayat"],
                "Population": habitation["population"],
                "Risk": habitation.get("risk", {}).get("risk_band", "UNKNOWN"),
                "Risk score": round(habitation.get("risk", {}).get("composite_risk", 0), 1),
                "Priority": habitation.get("priority", {}).get("priority_tier", "UNKNOWN"),
                "Latitude": habitation["latitude"],
                "Longitude": habitation["longitude"],
            }
            for habitation in db.habitations
        ]
    )


def site_table() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Site": site["name"],
                "Panchayat": site["panchayat"],
                "Available capacity": site.get("available_capacity", 0),
                "Safety score": round(site.get("safety_score", 0), 2),
                "Binding constraint": site.get("binding_constraint", "N/A"),
                "Excluded": site.get("is_inside_hazard_zone", False)
                or site.get("is_protected_eco_area", False),
                "Latitude": site["latitude"],
                "Longitude": site["longitude"],
            }
            for site in db.candidate_sites
        ]
    )


st.title("AASHRAYA-GIS Command Center")
st.caption("Wayanad prototype deployment | Multi-hazard relocation decision support")

summary = get_dashboard_summary()

with st.sidebar:
    st.header("Command context")
    role = st.selectbox("Operator role", ["District DMA", "State DMA", "GIS Analyst"])
    st.caption(f"Active role: {role}")
    st.divider()
    st.subheader("Rainfall simulation")
    rainfall = st.slider("Injected rainfall (mm)", 50, 250, 100, step=10)
    if st.button("Simulate heavy rainfall", use_container_width=True):
        result = inject_heavy_rainfall(SimulationRequest(rainfall_increment_mm=rainfall))
        st.session_state["simulation_message"] = (
            f"Simulation applied: {result['escalated_to_immediate_count']} habitations escalated to immediate."
        )
        st.rerun()
    if st.button("Restore baseline", use_container_width=True):
        reset_simulation()
        st.session_state["simulation_message"] = "Baseline conditions restored."
        st.rerun()

if st.session_state.get("simulation_message"):
    st.info(st.session_state["simulation_message"])

st.subheader("Operational overview")
metrics = st.columns(5)
metrics[0].metric("Habitations assessed", summary["total_habitations_assessed"])
metrics[1].metric("Red-zone habitations", summary["red_zone_habitations_count"])
metrics[2].metric("Immediate priority", summary["critical_immediate_count"])
metrics[3].metric("Population to relocate", summary["population_requiring_relocation"])
metrics[4].metric("Safe capacity", summary["total_safe_capacity_available"])

simulation = summary["current_simulation_state"]
if simulation["is_active"]:
    st.warning(f"Simulation active: +{simulation['injected_rainfall_mm']} mm rainfall")

left, right = st.columns(2)
with left:
    st.subheader("Priority distribution")
    st.bar_chart(pd.Series(summary["priority_distribution"], name="Habitations"))
with right:
    st.subheader("Hazard distribution")
    st.bar_chart(pd.Series(summary["hazard_distribution"], name="Habitations"))

st.subheader("Assessed habitations")
habitations = habitation_table()
priority_filter = st.multiselect(
    "Filter priority tiers",
    sorted(habitations["Priority"].unique()),
    default=sorted(habitations["Priority"].unique()),
)
filtered_habitations = habitations[habitations["Priority"].isin(priority_filter)]
st.dataframe(filtered_habitations, use_container_width=True, hide_index=True)
st.map(filtered_habitations[["Latitude", "Longitude"]].rename(columns={"Latitude": "lat", "Longitude": "lon"}))

st.subheader("Candidate relocation sites")
st.dataframe(site_table(), use_container_width=True, hide_index=True)

with st.expander("Active alerts"):
    if summary["active_alerts"]:
        st.dataframe(pd.DataFrame(summary["active_alerts"]), use_container_width=True, hide_index=True)
    else:
        st.success("No active alerts.")
