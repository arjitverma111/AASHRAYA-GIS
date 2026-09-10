import {
  DashboardOverview,
  Habitation,
  CandidateSite,
  OptimizationResponse,
  AuditLogEntry
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export const api = {
  async getDashboard(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  async getHabitations(filters?: {
    panchayat?: string;
    tehsil?: string;
    risk_band?: string;
    priority_tier?: string;
  }): Promise<{ count: number; habitations: Habitation[] }> {
    const params = new URLSearchParams();
    if (filters?.panchayat) params.append('panchayat', filters.panchayat);
    if (filters?.tehsil) params.append('tehsil', filters.tehsil);
    if (filters?.risk_band) params.append('risk_band', filters.risk_band);
    if (filters?.priority_tier) params.append('priority_tier', filters.priority_tier);

    const res = await fetch(`${API_BASE_URL}/habitations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch habitations');
    return res.json();
  },

  async getHabitationDetail(id: string): Promise<{
    habitation: Habitation;
    recommended_candidate_sites: any[];
    audit_history: AuditLogEntry[];
  }> {
    const res = await fetch(`${API_BASE_URL}/habitations/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch habitation ${id}`);
    return res.json();
  },

  async getHazardLayers(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/hazards/layers`);
    if (!res.ok) throw new Error('Failed to fetch hazard layers');
    return res.json();
  },

  async getCandidateSites(includeExcluded: boolean = true): Promise<{ count: number; candidate_sites: CandidateSite[] }> {
    const res = await fetch(`${API_BASE_URL}/relocation/sites?include_excluded=${includeExcluded}`);
    if (!res.ok) throw new Error('Failed to fetch candidate sites');
    return res.json();
  },

  async optimizeRelocation(payload: {
    habitation_ids?: string[];
    tier_filter?: string;
    safety_margin?: number;
  }): Promise<OptimizationResponse> {
    const res = await fetch(`${API_BASE_URL}/relocation/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Optimization solver failed');
    return res.json();
  },

  async submitApproval(payload: {
    habitation_id: string;
    action: string;
    operator_role: string;
    operator_name: string;
    justification: string;
    overridden_site_id?: string | null;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/relocation/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit approval');
    return res.json();
  },

  async injectRainfall(rainfall_increment_mm: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/simulation/heavy-rainfall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rainfall_increment_mm })
    });
    if (!res.ok) throw new Error('Simulation trigger failed');
    return res.json();
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/simulation/reset`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAuditLogs(): Promise<{ total_records: number; logs: AuditLogEntry[] }> {
    const res = await fetch(`${API_BASE_URL}/audit/logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
};
