import React from 'react';
import RoleCard from './RoleCard';
import { ROLES_DATA } from '../data/rolesData';
import { Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function RoleShowcase() {
  return (
    <section id="roles" className="py-12">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400 mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>Role-Based Operational Architecture</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Three Dedicated Stakeholder Portals
        </h2>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">
          Engineered for strict data isolation, role-based workflows, and automated readiness verification across Coaches, Players, and Talent Scouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ROLES_DATA.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </section>
  );
}

