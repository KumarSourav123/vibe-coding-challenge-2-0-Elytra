'use client';

import React from 'react';
import HeroBanner from '@/frontend/features/landing/components/HeroBanner';
import HealthStatusCard from '@/frontend/features/health/components/HealthStatusCard';
import RoleShowcase from '@/frontend/features/roles/components/RoleShowcase';
import AcademyRulesSection from '@/frontend/features/landing/components/AcademyRulesSection';
import TechStackSection from '@/frontend/features/landing/components/TechStackSection';
import { useHealthCheck } from '@/frontend/features/health/hooks/useHealthCheck';
import { ShieldCheck, Flag, ArrowUpRight } from 'lucide-react';

export default function HomePage() {
  const {
    state: healthState,
    data: healthData,
    errorMessage: healthErrorMessage,
    lastChecked: healthLastChecked,
    isRefreshing: isHealthRefreshing,
    mockMode,
    setSimulationMode,
    refresh: refreshHealth,
  } = useHealthCheck();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* 1. Hero Section */}
      <HeroBanner
        onExploreRoles={() => scrollTo('roles')}
        onCheckHealth={() => scrollTo('health-monitor')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-16">
        {/* 2. Health & Database Connectivity Monitor */}
        <section id="health-monitor" className="scroll-mt-20">
          <HealthStatusCard
            state={healthState}
            data={healthData}
            errorMessage={healthErrorMessage}
            lastChecked={healthLastChecked}
            isRefreshing={isHealthRefreshing}
            mockMode={mockMode}
            setSimulationMode={setSimulationMode}
            onRefresh={refreshHealth}
          />
        </section>

        {/* 3. Three Stakeholder Roles (Coach, Player, Scout) */}
        <RoleShowcase />

        {/* 4. Core Business Rules Breakdown */}
        <AcademyRulesSection />

        {/* 5. Technical Stack & File Ownership */}
        <TechStackSection />

        {/* 6. Phase 1 Verification Callout */}
        <section className="p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Phase 1 Foundation Complete</h3>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                The frontend architecture, responsive layout, reusable component library, role profiles, and
                contract-based database health integration are operational. Ready for Phase 2 authentication integration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => scrollTo('health-monitor')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-900/40"
            >
              <span>Test Live Health</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

