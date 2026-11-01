'use client';

import React from 'react';
import { ArrowRight, Trophy, ShieldCheck, Flame, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import Button from '@/frontend/components/common/Button';
import Badge from '@/frontend/components/common/Badge';

export default function HeroBanner({ onExploreRoles, onCheckHealth }) {
  return (
    <div className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden sports-hero-glow">
      <div className="max-w-5xl mx-auto text-center px-4 sm:px-6">
        {/* Top pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-emerald-400 mb-6 shadow-sm shadow-emerald-500/10">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>7-Day Vibe Coding Challenge • Phase 1 Foundation</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
          Precision Athlete Management &amp;{' '}
          <span className="sports-gradient-text block mt-1 sm:inline">
            Readiness Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          A centralized, role-governed platform uniting <strong className="text-white">Coaches</strong>,{' '}
          <strong className="text-white">Athletes</strong>, and <strong className="text-white">Talent Scouts</strong>.
          Enforces immutable attendance tracking, same-day match eligibility, and mathematical readiness thresholds.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={onExploreRoles}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Explore Stakeholder Portals
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={onCheckHealth}
            leftIcon={<Activity className="w-4 h-4 text-emerald-400" />}
          >
            Inspect Database Health
          </Button>
        </div>

        {/* Key Metrics / Highlights Bar */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">&ge; 75% Attendance</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Calculated strictly from completed practice sessions.
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">&ge; 2 Official Matches</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Same-day &amp; same-sport attendance validation.
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">100% Immutable</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Closed sessions cannot be modified or tampered with.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

