import React, { useState, useEffect } from 'react';
import { FileText, X, CheckCircle, AlertTriangle, Shield, Clock } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getAuditLogs()
        .then((res) => {
          setLogs(res.logs);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-command-900 border border-command-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-command-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-600/60 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Official Decision Audit Trail</h2>
              <p className="text-xs text-slate-400">Immutable Log of Human Authority Approvals & Parameter Modifications</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading audit entries...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No decisions logged yet.</div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 bg-command-950 rounded-xl border border-command-800 space-y-1.5 text-xs hover:border-command-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        entry.action === 'APPROVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : entry.action === 'OVERRIDE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}
                    >
                      {entry.action}
                    </span>
                    <strong className="text-white text-sm">{entry.habitation_name}</strong>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{entry.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                  <span>Sign-off Role: <strong className="text-slate-200">{entry.operator_role}</strong></span>
                  <span>Operator: <strong className="text-slate-200">{entry.operator_name}</strong></span>
                  {entry.overridden_site_id && (
                    <span>Override Site: <strong className="text-cyan-400">{entry.overridden_site_id}</strong></span>
                  )}
                </div>

                <p className="text-slate-300 italic bg-command-900/60 p-2 rounded border border-command-800/80 mt-1">
                  "{entry.justification}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-command-800 flex justify-between items-center text-xs text-slate-400">
          <span>Compliant with NDRF / MHA Audit Trail Norms (FR-18, FR-19)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-command-800 hover:bg-command-750 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
