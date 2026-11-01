import React from 'react';
import { Layers, Database, Code, Shield, GitBranch, Cloud } from 'lucide-react';

const TECH_ITEMS = [
  {
    name: 'Next.js 14 App Router',
    role: 'Full-stack Platform',
    desc: 'Unified React framework powering client components and server route handlers.',
    icon: Code,
  },
  {
    name: 'JavaScript (ES6+)',
    role: 'Language Standard',
    desc: 'Lightweight, rapid execution without TypeScript compilation overhead.',
    icon: Layers,
  },
  {
    name: 'Tailwind CSS',
    role: 'Athletic Styling Engine',
    desc: 'Responsive, high-performance styling with custom sports-themed color palettes.',
    icon: Layers,
  },
  {
    name: 'MongoDB Atlas & Mongoose',
    role: 'Database & ORM',
    desc: 'Cloud NoSQL cluster providing flexible schema modeling for sessions, matches, and players.',
    icon: Database,
  },
  {
    name: 'Route Handlers (/api/*)',
    role: 'Backend APIs',
    desc: 'Thin Next.js server endpoints delegating to reusable business service logic.',
    icon: Shield,
  },
  {
    name: 'Vercel Deployment',
    role: 'Production Host',
    desc: 'Optimized serverless runtime suitable for instant, zero-configuration deployments.',
    icon: Cloud,
  },
];

export default function TechStackSection() {
  return (
    <section id="architecture" className="py-16 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-blue-400 mb-3">
            <Layers className="w-4 h-4" />
            <span>Modern Tech Stack</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Integrated Architecture &amp; Technology
          </h2>
          <p className="mt-3 text-slate-400 text-sm md:text-base leading-relaxed">
            One single, integrated Next.js application built strictly in accordance with competition rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="sports-card p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                      {item.role}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

