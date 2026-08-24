import React from 'react';
import { Shield } from 'lucide-react';

export default function LoadingScreen({ message = 'Checking session...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 animate-pulse">
            <Shield className="w-10 h-10" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-sm -z-10 animate-pulse"></div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-white font-mono">
            SecureDrop
          </h2>
          <p className="text-xs text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
