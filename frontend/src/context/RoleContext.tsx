import React, { createContext, useContext, useMemo, useState } from 'react';
import { UserRole } from '../types';

export interface RoleConfig {
  label: string;
  level: 'district' | 'state' | 'analyst';
  scopeLabel: string;
  geographyLabel: string;
  mapCenter: [number, number];
  mapZoom: number;
  datasetScope: string;
  showAdvancedAnalysis: boolean;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  'District DMA': {
    label: 'District DMA • Wayanad',
    level: 'district',
    scopeLabel: 'District operational scope',
    geographyLabel: 'Wayanad, Kerala',
    mapCenter: [11.685, 76.135],
    mapZoom: 11,
    datasetScope: 'Wayanad district prototype dataset',
    showAdvancedAnalysis: false,
  },
  'State DMA': {
    label: 'State DMA • Kerala',
    level: 'state',
    scopeLabel: 'State overview scope',
    geographyLabel: 'Kerala state view',
    mapCenter: [10.85, 76.27],
    mapZoom: 7,
    datasetScope: 'Kerala view currently backed by Wayanad prototype records',
    showAdvancedAnalysis: false,
  },
  'GIS Analyst': {
    label: 'GIS / Scientific Analyst',
    level: 'analyst',
    scopeLabel: 'Scientific analysis scope',
    geographyLabel: 'Wayanad geospatial study area',
    mapCenter: [11.685, 76.135],
    mapZoom: 11,
    datasetScope: 'Wayanad terrain, hazard, confidence, and model outputs',
    showAdvancedAnalysis: true,
  },
};

interface RoleContextValue {
  userRole: UserRole;
  roleConfig: RoleConfig;
  setUserRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const savedRole = window.localStorage.getItem('aashraya.userRole') as UserRole | null;
    return savedRole && savedRole in ROLE_CONFIG ? savedRole : 'District DMA';
  });

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    window.localStorage.setItem('aashraya.userRole', role);
  };

  const value = useMemo(() => ({
    userRole,
    roleConfig: ROLE_CONFIG[userRole],
    setUserRole,
  }), [userRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRoleContext = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRoleContext must be used inside RoleProvider');
  return context;
};
