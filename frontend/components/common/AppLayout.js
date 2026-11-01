'use client';

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useHealthCheck } from '@/frontend/features/health/hooks/useHealthCheck';

export default function AppLayout({ children }) {
  const { state: healthState, data: healthData } = useHealthCheck({
    autoPoll: true,
    pollIntervalMs: 25000,
  });

  const handleHealthClick = () => {
    const el = document.getElementById('health-monitor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        healthState={healthState}
        latencyMs={healthData?.latencyMs}
        onHealthClick={handleHealthClick}
      />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}

