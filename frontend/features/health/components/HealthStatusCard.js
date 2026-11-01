'use client';

import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Activity,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import Button from '@/frontend/components/common/Button';
import Badge from '@/frontend/components/common/Badge';

export default function HealthStatusCard({
  state,
  data,
  errorMessage,
  lastChecked,
  isRefreshing,
  mockMode,
  setSimulationMode,
  onRefresh,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const getStatusBadge = () => {
    switch (state) {
      case 'connected':
        return (
          <Badge variant="success" size="lg" dot>
            Connected & Healthy
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="danger" size="lg" dot>
            Disconnected / Offline
          </Badge>
        );
      case 'loading':
      default:
        return (
          <Badge variant="warning" size="lg">
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
            Connecting...
          </Badge>
        );
    }
  };

  return (
    <div className="sports-card p-6 md:p-8 relative overflow-hidden">
      {/* Background ambient glow based on state */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          state === 'connected'
            ? 'bg-emerald-500/10'
            : state === 'disconnected'
            ? 'bg-rose-500/10'
            : 'bg-amber-500/10'
        }`}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              state === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : state === 'disconnected'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Database & API Health Monitor</h2>
              {mockMode !== 'real' && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Simulation Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Phase 1 Live Connection Verification • Next.js App Router to MongoDB Atlas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button
            size="sm"
            variant="secondary"
            isLoading={isRefreshing}
            onClick={onRefresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Trigger immediate health check ping"
          >
            Ping Status
          </Button>
        </div>
      </div>

      {/* Main Body Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Connection Status */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>MONGODB STATUS</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {state === 'connected' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400">Online & Synced</span>
              </>
            ) : state === 'disconnected' ? (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-rose-400">Disconnected</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                <span className="text-amber-400">Connecting...</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono truncate">
            Target: MongoDB Atlas (Mongoose)
          </div>
        </div>

        {/* Metric 2: Endpoint Route */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>API ENDPOINT</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white truncate">
            /api/health
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            Method: GET • JSON Schema
          </div>
        </div>

        {/* Metric 3: Roundtrip Latency */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>RESPONSE LATENCY</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {data?.latencyMs ? `${data.latencyMs} ms` : state === 'connected' ? '< 50 ms' : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono truncate">
            {lastChecked ? `Checked ${lastChecked.toLocaleTimeString()}` : 'Awaiting check'}
          </div>
        </div>

        {/* Metric 4: Architecture */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>PLATFORM ENGINE</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white">
            Next.js 14 App
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            Vercel Ready • JavaScript
          </div>
        </div>
      </div>

      {/* State-specific Alert Message */}
      {state === 'disconnected' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">Database Connection Required for Live Operations</p>
              <p className="mt-1 text-slate-300">
                {errorMessage ||
                  'The frontend was unable to connect to /api/health or the database is currently unreachable.'}
              </p>
              <div className="mt-3 p-3 bg-slate-950/70 rounded-lg text-xs font-mono text-slate-400 border border-slate-800">
                Tip: Configure <code className="text-emerald-400">MONGODB_URI</code> in{' '}
                <code className="text-emerald-400">.env.local</code> and verify MongoDB Atlas Network Access (IP whitelist).
              </div>
            </div>
          </div>
        </div>
      )}

      {state === 'connected' && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-emerald-300">System Verified: </span>
              <span className="text-slate-300">
                MongoDB Atlas connection is active and the API health contract is operating normally.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Diagnostics & Interactive Testing Controls */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showDiagnostics ? 'Hide Diagnostic Details' : 'View Phase 1 Diagnostic Inspection & Mock Controls'}</span>
          </button>

          {/* Interactive Simulation Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Test Simulation:</span>
            <button
              onClick={() => setSimulationMode('real')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                mockMode === 'real'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Real API (/api/health)
            </button>
            <button
              onClick={() => setSimulationMode('mock-connected')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                mockMode === 'mock-connected'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Mock Connected
            </button>
            <button
              onClick={() => setSimulationMode('mock-disconnected')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                mockMode === 'mock-disconnected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Mock Disconnected
            </button>
          </div>
        </div>

        {showDiagnostics && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-white">Phase 1 Technical Verification Checklist</span>
              <span>Next.js 14 App Router</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Frontend Architecture: Modular Feature-first</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>API Client Contract: Normalized JSON Schema</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${state === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>Backend Route Handler: GET /api/health</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${state === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span>MongoDB Atlas Mongoose Pool: Initialized</span>
              </div>
            </div>

            {data && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-slate-500 block mb-1">Raw API Payload:</span>
                <pre className="p-3 bg-slate-900 rounded-lg overflow-x-auto text-[11px] text-emerald-400/90 leading-tight">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

