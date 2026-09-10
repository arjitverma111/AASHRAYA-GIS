# 3-Minute Hackathon Demonstration Script

**System:** AASHRAYA-GIS (Intelligent Multi-Hazard Red-Zone, Carrying-Capacity & Relocation Platform)  
**Target Audience:** Hackathon Judges, NDRF Technical Evaluators, State/District Disaster Management Authorities  
**Demo District:** Wayanad District, Kerala (Western Ghats)  
**Total Presentation Time:** 3 minutes (180 seconds)  

---

## Pitch Narrative Arc (15 Seconds)

> *"Disaster authorities in India face a tragic paradox: we have satellite hazard maps, but when monsoons strike, District Collectors have no evidence-based engineering system to decide **which villages must relocate first**, **where they can safely go**, and **whether candidate sites can physically absorb them**.  
> We built **AASHRAYA-GIS** — not a passive map, but an end-to-end Operations Research & AI Decision Engine."*

---

## Step-by-Step Walkthrough Flow

### Minute 0:00 – 0:45: The Command Center & Formula-Level Explainability

1. **Step 1: Open Command Center Dashboard (`/`)**
   - **Show:** The 8 high-level disaster metrics across Wayanad (24 habitations assessed, 3 Critical Red Zones, 4,950 people requiring immediate relocation, 18,700 total safe capacity).
   - **Say:** *"Notice the visual language: this is built as an NDRF National Command Center, not a generic SaaS dashboard. Every engine status is live in the telemetry bar."*

2. **Step 2: Inspect Priority Relocation Queue**
   - **Show:** The ranked village table at the bottom of the dashboard. Point to **Chooralmala** ranked #1 with an Immediate tier.
   - **Click:** Click on **Chooralmala** to open the **Habitation Detail Flyout Drawer**.

3. **Step 3: Answer "WHY This Ranking?" (The Core Differentiator)**
   - **Show:** The **Score Contribution Waterfall**:
     - Physical Hazard Severity: **38%**
     - Population Exposure: **25%**
     - Demographic Vulnerability: **23%**
     - Disaster Frequency: **14%**
   - **Show:** The Plain-Language Decision Rationale:
     > *"Classified as RED ZONE (Score: 88.4/100). Chooralmala has critical exposure to landslide instability (0.94 probability) on a 34.5° slope following 135mm of rainfall, compounded by 42% kutcha dwellings and 14.5 km distance to emergency healthcare."*
   - **Say:** *"We don't output a black-box AI number. Every single percent is traceable to physical slope, 24h rainfall, and Census 2011 indicators that a District Collector can legally defend in a high court or RTI enquiry."*

---

### Minute 0:45 – 1:45: Carrying Capacity Bottlenecks & MILP Optimization

4. **Step 4: Navigate to Relocation Planner (`/relocation`)**
   - **Show:** The Two-Column allocation workspace.
   - **Left Column:** Vulnerable habitations queue with checkboxes.
   - **Right Column:** Candidate Relocation Sites. Point to **Kalpetta South Relief Plateau** and **Sulthan Bathery Hub**.

5. **Step 5: Highlight Multi-Dimensional Bottlenecks (Not Just Land Area)**
   - **Show:** The **CapacityBottleneckCard** on **Kalpetta South**:
     - Land capacity: 4,750 people
     - Water headroom: 3,100 people (**BINDING CONSTRAINT at 100 LPCD**)
     - Healthcare PHC capacity: 2,850 people
     - Effective capacity: **2,422 people** (after applying the statutory 15% safety buffer)
   - **Say:** *"Notice this: Kalpetta has plenty of physical land for 4,700 people, but our carrying capacity engine detects that the water pumping infrastructure caps out at 3,100. The system prevents authorities from creating a secondary humanitarian crisis at the resettlement site."*
   - **Show:** Note the hard-excluded site **Chembra Foothills Buffer** marked with a red tag: *"The system automatically disqualifies candidate sites that fall inside hazard red zones or eco-sensitive forest zones."*

6. **Step 6: Click "Execute Optimal Allocation"**
   - **Action:** Click the green **"Execute Optimal Allocation"** button.
   - **Show:** In **under 50 milliseconds**, the PuLP Mixed-Integer Linear Programming (MILP) solver executes.
   - **Inspect:** The optimal assignment cards appear:
     - *Chooralmala (2,850 pop) → Kalpetta South (11.2 km, Safety: 94%, 1,200 headroom remaining)*
     - *Mundakkai (2,100 pop) → Meenangadi Resilient Township (14.8 km, Safety: 95%)*
   - **Click:** Click **"View Routes on Map"** to transition to the GIS map and see the dashed cyan allocation corridors connecting the villages to their safe shelters!

---

### Minute 1:45 – 2:30: Live Dynamic Hazard Simulation (The "WOW" Moment)

7. **Step 7: Click "Simulate Heavy Rain" in Top Navbar**
   - **Action:** Open the **Rainfall Simulator Modal**.
   - **Select:** Click preset **"2024 Chooralmala Cloudburst: +220mm / 24h"** (or use the slider to set +180mm).
   - **Click:** **"Inject +220mm"**.

8. **Step 8: Watch Real-Time Recompute Live Without Reloading**
   - **Show:**
     - The modal broadcasts: *"Real-Time Recompute Complete: 4 habitations surged into IMMEDIATE relocation tier!"*
     - A pulsing red **Critical Alert Banner** immediately flashes across the top of the screen:  
       `[CRITICAL ALERT]: Vellarmala has escalated from Short-Term to IMMEDIATE following 220mm precipitation influx.`
     - Close modal and look at the map: previously yellow/orange villages have turned pulsing red, and red-zone polygons are saturated.
   - **Say:** *"In a single click, our dynamic simulation pipeline recomputed the Landslide Random Forest classifier, re-evaluated HAND riverine flooding, recalculated composite risk, and updated the relocation queue. This directly fulfills the NDRF requirement for dynamic re-zonation."*

---

### Minute 2:30 – 3:00: Human Governance, Audit Log, & Conclusion

9. **Step 9: Human Authority Sign-Off & Audit Trail**
   - **Action:** Open a habitation drawer, select **"Approve Plan"**, type: *"Field verification of KWA water feeder complete. Approved for Stage 1 evacuation."* Click **Submit**.
   - **Open:** Click **"Audit Log"** in the top navigation bar.
   - **Show:** The immutable chronological audit entry with timestamp, operator role (*District DMA*), and full justification.
   - **Say:** *"In disaster management, AI must advise, but humans must decide. Every single decision is logged with an append-only audit trail."*

10. **Conclusion (Final Sentence):**
    > *"AASHRAYA-GIS proves that by combining classical GIS, transparent Machine Learning, bottleneck carrying capacity, and exact Operations Research optimization, we can turn reactive disaster displacement into proactive, life-saving precision planning. Thank you!"*
