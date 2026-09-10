import React from 'react';
import { Database, Cpu, Radio, MapPin } from 'lucide-react';

interface SystemStatusProps {
  statusData?: Record<string, string>;
  isSimulating?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ statusData, isSimulating }) => {
  return (
    <div className="bg-command-950 border-b border-command-800/80 px-4 py-1.5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center space-x-4 overflow-x-auto">
        <div className="flex items-center space-x-1 text-slate-300 font-medium">
          <MapPin className="w-3 h-3 text-red-400" />
          <span>District: <strong className="text-white font-semibold">Wayanad, Kerala</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GIS Engine: <span className="text-emerald-400 font-mono">ONLINE</span></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>ML Classifier: <span className="text-cyan-400 font-mono">RF-100 Ready</span></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Database className="w-3 h-3 text-amber-400" />
          <span>Carrying Capacity: <span className="text-amber-400 font-mono">Bottleneck +15%</span></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>MILP Solver: <span className="text-blue-400 font-mono">PuLP/CBC Active</span></span>
        </div>
      </div>

      <div className="flex items-center space-x-2 font-mono">
        <Radio className={`w-3 h-3 ${isSimulating ? 'text-purple-400 animate-spin' : 'text-slate-500'}`} />
        <span className={isSimulating ? 'text-purple-300 font-semibold' : 'text-slate-500'}>
          {isSimulating ? 'SIMULATION FEED: ACTIVE PRECIPITATION' : 'TELEMETRY: BASELINE REPLAY'}
        </span>
      </div>
    </div>
  );
};
