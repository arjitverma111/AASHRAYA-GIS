import React from 'react';
import { Habitation, CandidateSite, AllocationAssignment } from '../types';
import { MapComponent } from '../components/MapComponent';
import { RoleConfig } from '../context/RoleContext';

interface MapPageProps {
  habitations: Habitation[];
  candidateSites: CandidateSite[];
  hazardGeoJson: any;
  selectedHabitationId: string | null;
  onSelectHabitation: (id: string) => void;
  activeAssignments?: AllocationAssignment[];
  roleConfig: RoleConfig;
}

export const MapPage: React.FC<MapPageProps> = ({
  habitations,
  candidateSites,
  hazardGeoJson,
  selectedHabitationId,
  onSelectHabitation,
  activeAssignments,
  roleConfig,
}) => {
  return (
    <div className="w-full h-full relative">
      <MapComponent
        habitations={habitations}
        candidateSites={candidateSites}
        hazardGeoJson={hazardGeoJson}
        selectedHabitationId={selectedHabitationId}
        onSelectHabitation={onSelectHabitation}
        activeAssignments={activeAssignments}
        roleConfig={roleConfig}
      />
    </div>
  );
};
