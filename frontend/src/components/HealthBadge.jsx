import React from 'react';
import { API_BASE_URL } from '../services/api';
import { CheckCircle2, Server } from 'lucide-react';

export default function HealthBadge() {
  const isConfigured = Boolean(API_BASE_URL);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 w-full max-w-md mx-auto text-left shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Backend API Connection
        </span>
        <div className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Ready</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">
            {isConfigured ? 'FastAPI Backend Configured' : 'Backend Configured'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center space-x-1">
          <Server className="w-3 h-3 text-slate-500" />
          <span>Endpoint:</span>
        </span>
        <span className="text-slate-300 truncate max-w-[220px]" title={API_BASE_URL}>
          {API_BASE_URL || 'Configured via Environment'}
        </span>
      </div>
    </div>
  );
}
