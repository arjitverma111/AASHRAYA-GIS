import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  Habitation,
  CandidateSite,
  DashboardOverview,
  OptimizationResponse,
} from './types';

// Components
import { Navbar } from './components/Navbar';
import { SystemStatus } from './components/SystemStatus';
import { LiveAlertBanner } from './components/LiveAlertBanner';
import { HabitationDetailDrawer } from './components/HabitationDetailDrawer';
import { RainfallSimulatorModal } from './components/RainfallSimulatorModal';
import { AuditLogModal } from './components/AuditLogModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { RelocationPage } from './pages/RelocationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { useRoleContext } from './context/RoleContext';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const { userRole, roleConfig, setUserRole } = useRoleContext();

  // Core Data State
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [candidateSites, setCandidateSites] = useState<CandidateSite[]>([]);
  const [hazardGeoJson, setHazardGeoJson] = useState<any>(null);

  // Selected Habitation for Detail Flyout
  const [selectedHabitationId, setSelectedHabitationId] = useState<string | null>(null);

  // Optimization Result
  const [lastOptimization, setLastOptimization] = useState<OptimizationResponse | null>(null);

  // Modals
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState<boolean>(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState<boolean>(false);

  // Initial Data Load
  const loadPlatformData = async () => {
    try {
      const [dashRes, habsRes, sitesRes, hzRes] = await Promise.all([
        api.getDashboard(),
        api.getHabitations(),
        api.getCandidateSites(true),
        api.getHazardLayers(),
      ]);

      setOverview(dashRes);
      setHabitations(habsRes.habitations);
      setCandidateSites(sitesRes.candidate_sites);
      setHazardGeoJson(hzRes);
    } catch (err) {
      console.error('Failed loading platform data:', err);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const isSimulating = overview?.current_simulation_state?.is_active || false;
  const injectedRain = overview?.current_simulation_state?.injected_rainfall_mm || 0;

  return (
    <div className="min-h-screen flex flex-col bg-command-950 text-slate-100 selection:bg-red-600 selection:text-white">
      {/* Top Command Center Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        onOpenSimulation={() => setIsSimulationModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogModalOpen(true)}
        isSimulationActive={isSimulating}
        injectedRainfall={injectedRain}
      />

      {/* Live Alert Ticker Banner */}
      {overview?.active_alerts && overview.active_alerts.length > 0 && (
        <LiveAlertBanner
          alerts={overview.active_alerts}
          onSelectHabitation={(id) => setSelectedHabitationId(id)}
        />
      )}

      {/* Telemetry Status Bar */}
      <SystemStatus
        statusData={overview?.system_status}
        isSimulating={isSimulating}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <DashboardPage
            overview={overview}
            habitations={habitations}
            userRole={userRole}
            onSelectHabitation={(id) => setSelectedHabitationId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenSimulation={() => setIsSimulationModalOpen(true)}
          />
        )}

        {currentTab === 'map' && (
          <MapPage
            habitations={habitations}
            candidateSites={candidateSites}
            hazardGeoJson={hazardGeoJson}
            selectedHabitationId={selectedHabitationId}
            onSelectHabitation={(id) => setSelectedHabitationId(id)}
            activeAssignments={lastOptimization?.assignments}
            roleConfig={roleConfig}
          />
        )}

        {currentTab === 'relocation' && (
          <RelocationPage
            habitations={habitations}
            candidateSites={candidateSites}
            onSelectHabitation={(id) => setSelectedHabitationId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            lastOptimization={lastOptimization}
            setLastOptimization={setLastOptimization}
            roleConfig={roleConfig}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsPage roleConfig={roleConfig} />}

        {currentTab === 'methodology' && <MethodologyPage />}
      </main>

      {/* Habitation Detail Flyout Drawer */}
      <HabitationDetailDrawer
        habitationId={selectedHabitationId}
        onClose={() => setSelectedHabitationId(null)}
        userRole={userRole}
        onActionComplete={loadPlatformData}
      />

      {/* Simulation Trigger Modal */}
      <RainfallSimulatorModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSimulationTriggered={loadPlatformData}
        isSimulating={isSimulating}
        currentRainfallIncrement={injectedRain}
        userRole={userRole}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogModalOpen}
        onClose={() => setIsAuditLogModalOpen(false)}
      />
    </div>
  );
}

export default App;
