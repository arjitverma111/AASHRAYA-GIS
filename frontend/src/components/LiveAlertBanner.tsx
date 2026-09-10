import React from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { AlertItem } from '../types';

interface LiveAlertBannerProps {
  alerts: AlertItem[];
  onSelectHabitation?: (habId: string) => void;
}

export const LiveAlertBanner: React.FC<LiveAlertBannerProps> = ({ alerts, onSelectHabitation }) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || !alerts || alerts.length === 0) return null;

  const topAlert = alerts[0];
  const isCritical = topAlert.severity === 'CRITICAL';

  return (
    <div
      className={`px-4 py-2 text-xs flex items-center justify-between border-b transition-all ${
        isCritical
          ? 'bg-red-950/90 text-red-200 border-red-800/80 shadow-inner'
          : 'bg-amber-950/80 text-amber-200 border-amber-800/80'
      }`}
    >
      <div className="flex items-center space-x-2.5 overflow-hidden">
        <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-amber-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></span>
        </span>
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
        <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 flex-shrink-0">
          {topAlert.severity} ALERT
        </span>
        <span className="font-mono text-[11px] text-slate-400 flex-shrink-0">[{topAlert.timestamp.split(' ')[1] || topAlert.timestamp}]</span>
        <p className="truncate font-medium">{topAlert.message}</p>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
        {topAlert.habitation_id && topAlert.habitation_id !== 'DISTRICT_WIDE' && onSelectHabitation && (
          <button
            onClick={() => onSelectHabitation(topAlert.habitation_id)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-900/60 hover:bg-red-800 text-white border border-red-600/50"
          >
            <span>Inspect</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-black/30 rounded text-slate-400 hover:text-white"
          title="Dismiss alert banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
