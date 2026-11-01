import React from 'react';
import {
  ShieldAlert,
  CalendarCheck,
  Award,
  Lock,
  UserCheck,
  EyeOff,
  Flame,
  FileCheck2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const RULES = [
  {
    num: '01',
    title: 'Player Creation',
    desc: 'Coach creates players with name, age, and assigned sport discipline.',
    icon: UserCheck,
    tag: 'Roster',
  },
  {
    num: '02',
    title: 'Session Creation',
    desc: 'Coach schedules practice sessions defined strictly by date and sport.',
    icon: CalendarCheck,
    tag: 'Training',
  },
  {
    num: '03',
    title: 'Attendance Marking',
    desc: 'Coach marks each eligible roster player as Present or Absent.',
    icon: FileCheck2,
    tag: 'Integrity',
  },
  {
    num: '04',
    title: 'Session Finalization',
    desc: 'Coach closes the session immediately after attendance is completed.',
    icon: Lock,
    tag: 'Workflow',
  },
  {
    num: '05',
    title: 'Session Immutability',
    desc: 'Closed sessions are locked permanently and cannot be modified under any condition.',
    icon: ShieldAlert,
    tag: 'Security',
    highlight: true,
  },
  {
    num: '06',
    title: 'Match Scheduling',
    desc: 'Coach creates official matches with date, sport category, and opponent name.',
    icon: Award,
    tag: 'Competition',
  },
  {
    num: '07',
    title: 'Same-Day Presence Match Rule',
    desc: "Only eligible players who were PRESENT on the same date and sport's practice session can be included in that day's match.",
    icon: CalendarCheck,
    tag: 'Critical Rule',
    highlight: true,
  },
  {
    num: '08',
    title: 'Individual Player Scoring',
    desc: 'Each participating player receives a recorded individual match score.',
    icon: Award,
    tag: 'Scoring',
  },
  {
    num: '09',
    title: 'Completed Session Attendance %',
    desc: 'Attendance percentage is computed strictly from actual completed (closed) practice sessions.',
    icon: FileCheck2,
    tag: 'Math Formula',
  },
  {
    num: '10',
    title: 'Readiness Formula',
    desc: 'A player is READY only if: Attendance >= 75% AND Matches Played >= 2. Calculated from live DB data.',
    icon: Flame,
    tag: 'Readiness Core',
    highlight: true,
  },
  {
    num: '11',
    title: 'Scout Ready-Only Visibility',
    desc: 'Scouts are strictly restricted to viewing only Ready players. Non-ready players are completely hidden.',
    icon: EyeOff,
    tag: 'Access Control',
    highlight: true,
  },
  {
    num: '12',
    title: 'Player Private Isolation',
    desc: 'Players can view only their own records, attendance, and match history. Zero peer data leakage.',
    icon: Lock,
    tag: 'Privacy',
  },
];

export default function AcademyRulesSection() {
  return (
    <section id="rules" className="py-16 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-amber-400 mb-3">
            <ShieldAlert className="w-4 h-4" />
            <span>Strict Competition Business Rules</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            12 Core Academy Business Rules
          </h2>
          <p className="mt-3 text-slate-400 text-sm md:text-base leading-relaxed">
            Every feature, model, and UI across all 7 phases adheres strictly to these 12 immutable principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.num}
                className={`p-5 rounded-xl border transition-all duration-200 ${
                  rule.highlight
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-500">RULE {rule.num}</span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      rule.highlight
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {rule.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      rule.highlight ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{rule.title}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{rule.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

