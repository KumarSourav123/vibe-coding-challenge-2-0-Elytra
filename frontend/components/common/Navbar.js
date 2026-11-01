'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Menu, X, Shield, Activity } from 'lucide-react';
import HealthIndicatorPill from '@/frontend/features/health/components/HealthIndicatorPill';

export default function Navbar({ healthState = 'loading', latencyMs = null, onHealthClick = () => {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 font-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              APEX SPORTS ACADEMY
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">
              Management System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('roles')}
            className="hover:text-emerald-400 transition-colors"
          >
            Role Portals
          </button>
          <button
            onClick={() => scrollToSection('health-monitor')}
            className="hover:text-emerald-400 transition-colors"
          >
            Database Health
          </button>
          <button
            onClick={() => scrollToSection('rules')}
            className="hover:text-emerald-400 transition-colors"
          >
            Academy Rules
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="hover:text-emerald-400 transition-colors"
          >
            Architecture
          </button>
        </nav>

        {/* Right side status & action */}
        <div className="hidden sm:flex items-center gap-4">
          <HealthIndicatorPill
            state={healthState}
            latencyMs={latencyMs}
            onClick={onHealthClick}
          />
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Phase 1 Foundation
          </span>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <HealthIndicatorPill
            state={healthState}
            latencyMs={latencyMs}
            onClick={onHealthClick}
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-2 pb-6 space-y-3">
          <button
            onClick={() => scrollToSection('roles')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Role Portals (Coach, Player, Scout)
          </button>
          <button
            onClick={() => scrollToSection('health-monitor')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Database Health Monitor
          </button>
          <button
            onClick={() => scrollToSection('rules')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Academy Business Rules
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-emerald-400"
          >
            Phase 1 Architecture
          </button>
        </div>
      )}
    </header>
  );
}

