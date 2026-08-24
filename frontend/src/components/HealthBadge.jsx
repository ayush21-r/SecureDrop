import React, { useEffect, useState } from 'react';
import { getHealthStatus, API_BASE_URL } from '../services/api';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function HealthBadge() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'connected' | 'disconnected'
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    setStatus('loading');
    const result = await getHealthStatus();
    if (result.success) {
      setData(result.data);
      setStatus('connected');
      setError(null);
    } else {
      setStatus('disconnected');
      setError(result.error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 w-full max-w-md mx-auto text-left shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Backend API Connection
        </span>
        <button
          onClick={checkStatus}
          disabled={status === 'loading'}
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
          title="Retry health check"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {status === 'loading' && (
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Checking FastAPI status...</span>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex items-center space-x-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">{data?.service || 'SecureDrop API'} is Online</span>
          </div>
        )}

        {status === 'disconnected' && (
          <div className="flex items-center space-x-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Backend Disconnected</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Target:</span>
        <span className="text-slate-300 truncate max-w-[220px]" title={API_BASE_URL}>
          {API_BASE_URL}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-xs text-rose-400/90 font-mono break-all">
          {error}
        </p>
      )}
    </div>
  );
}
