import React from 'react';
import { Trophy, Code2, ShieldAlert, Cpu, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/60">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span>Apex Sports Academy</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Precision athlete management, immutable attendance tracking, match readiness auditing, and talent scouting.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              7-Day Vibe Coding Challenge • Phase 1
            </div>
          </div>

          {/* Core Rules Quick Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Readiness Rules</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Attendance &ge; 75% threshold</li>
              <li>• &ge; 2 completed matches</li>
              <li>• Completed practice sessions only</li>
              <li>• Scouts view only Ready athletes</li>
            </ul>
          </div>

          {/* Architecture & Roles */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Architecture Boundaries</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Next.js App Router (Single App)</li>
              <li>• Frontend: <code className="text-emerald-400">frontend/</code></li>
              <li>• Backend: <code className="text-blue-400">backend/ & app/api/</code></li>
              <li>• Database: MongoDB Atlas (Mongoose)</li>
            </ul>
          </div>

          {/* Phase 1 Completion Note */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Phase Status</h4>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Phase 1 Foundation Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Phase 1 strictly establishes layout, landing page, role cards, reusable UI, and DB health integration.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Apex Sports Academy Management System. Built for Vibe Coding Challenge 2.0.
          </div>
          <div className="flex items-center gap-4">
            <span>JavaScript App Router</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

