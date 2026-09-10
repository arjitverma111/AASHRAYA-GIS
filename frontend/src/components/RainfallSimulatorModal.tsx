import React, { useState } from 'react';
import { CloudRain, AlertTriangle, RotateCcw, Play, CheckCircle, Zap } from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../types';

interface RainfallSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationTriggered: () => void;
  isSimulating: boolean;
  currentRainfallIncrement: number;
  userRole: UserRole;
}

export const RainfallSimulatorModal: React.FC<RainfallSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulationTriggered,
  isSimulating,
  currentRainfallIncrement,
  userRole,
}) => {
  const [rainfallIncrement, setRainfallIncrement] = useState<number>(150);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async (amount: number) => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await api.injectRainfall(amount);
      setResultMessage(res);
      setLoading(false);
      onSimulationTriggered();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetSimulation();
      setResultMessage(null);
      setLoading(false);
      onSimulationTriggered();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-command-900 border border-command-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-300">
            <CloudRain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Live Weather Simulation Feed</h2>
            <p className="text-xs text-slate-400">{userRole} scope · Dynamic Precipitation Injection & Real-Time Recompute</p>
          </div>
        </div>

        {/* Explanatory note */}
        <p className="text-xs text-slate-300 leading-relaxed bg-command-950 p-3 rounded-lg border border-command-800 mb-5">
          Simulate historical monsoon downpours in the active {userRole} context (e.g. 2024 Wayanad Cloudburst event) to demonstrate how the
          decision engine automatically recomputes <strong>Landslide ML probabilities</strong>, updates <strong>Red Zones</strong>,
          escalates <strong>Relocation Priority Tiers</strong>, and re-optimizes <strong>Candidate Relocation Sites</strong> in real time.
        </p>

        {/* Presets */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold uppercase text-slate-400">Select Realistic Weather Scenario:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setRainfallIncrement(60); handleRunSimulation(60); }}
              disabled={loading}
              className="p-2.5 bg-command-950 hover:bg-command-800 border border-command-700 rounded-lg text-left transition-all"
            >
              <div className="text-xs font-bold text-white">+60 mm / 24h</div>
              <div className="text-[10px] text-slate-400">Moderate Monsoon Surge</div>
            </button>

            <button
              onClick={() => { setRainfallIncrement(140); handleRunSimulation(140); }}
              disabled={loading}
              className="p-2.5 bg-command-950 hover:bg-command-800 border border-purple-700/60 rounded-lg text-left transition-all"
            >
              <div className="text-xs font-bold text-purple-300">+140 mm / 24h</div>
              <div className="text-[10px] text-slate-400">2019 Puthumala Replay</div>
            </button>

            <button
              onClick={() => { setRainfallIncrement(220); handleRunSimulation(220); }}
              disabled={loading}
              className="p-2.5 bg-command-950 hover:bg-command-800 border border-red-700/60 rounded-lg text-left transition-all"
            >
              <div className="text-xs font-bold text-red-400">+220 mm / 24h</div>
              <div className="text-[10px] text-slate-400">2024 Chooralmala Cloudburst</div>
            </button>
          </div>
        </div>

        {/* Custom Slider */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-semibold">Custom Rainfall Influx:</span>
            <span className="font-mono font-bold text-cyan-400">+{rainfallIncrement} mm / 24h</span>
          </div>
          <input
            type="range"
            min="20"
            max="250"
            step="10"
            value={rainfallIncrement}
            onChange={(e) => setRainfallIncrement(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+20 mm (Light)</span>
            <span>+120 mm (Heavy)</span>
            <span>+250 mm (Severe Extreme)</span>
          </div>
        </div>

        {/* Simulation Output Feedback */}
        {resultMessage && (
          <div className="p-3 bg-red-950/60 border border-red-700 rounded-lg mb-4 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center space-x-2 text-red-300 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Real-Time Recompute Complete!</span>
            </div>
            <div className="text-slate-300">
              <strong>{resultMessage.escalated_to_immediate_count}</strong> habitations surged into <strong>IMMEDIATE</strong> relocation tier.
            </div>
            <div className="text-slate-400 text-[11px]">
              {resultMessage.generated_alerts?.length || 0} critical emergency command alerts generated.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-command-800">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-command-950 hover:bg-command-850 text-slate-300 border border-command-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Baseline</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={() => handleRunSimulation(rainfallIncrement)}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-950/50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Recomputing...' : `Inject +${rainfallIncrement}mm`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
