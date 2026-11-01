'use client';

import React from 'react';
import { Database, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function HealthIndicatorPill({ state, latencyMs, onClick }) {
  const configs = {
    loading: {
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      dotColor: 'bg-amber-400 animate-spin',
      text: 'Checking DB...',
      icon: RefreshCw,
    },
    connected: {
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10',
      dotColor: 'bg-emerald-400 animate-pulse',
      text: 'Atlas Connected',
      icon: CheckCircle2,
    },
    disconnected: {
      bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      dotColor: 'bg-rose-400',
      text: 'DB Offline',
      icon: AlertCircle,
    },
  };

  const current = configs[state] || configs.loading;

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 hover:scale-105 ${current.bgColor}`}
      title="Click to view database connection status and diagnostics"
    >
      <span className={`w-2 h-2 rounded-full ${current.dotColor}`} />
      <span className="font-semibold tracking-wide">{current.text}</span>
      {state === 'connected' && latencyMs && (
        <span className="text-[10px] text-emerald-400/80 pl-1 border-l border-emerald-500/20 font-mono">
          {latencyMs}ms
        </span>
      )}
    </button>
  );
}

