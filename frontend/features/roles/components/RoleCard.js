'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  UserCheck,
  Target,
  ArrowRight,
  CheckCircle,
  Lock,
  Flame,
  Award,
  Zap,
  ChevronRight,
  X
} from 'lucide-react';
import Badge from '@/frontend/components/common/Badge';
import Button from '@/frontend/components/common/Button';

export default function RoleCard({ role }) {
  const [isOpenModal, setIsOpenModal] = useState(false);

  const getRoleIcon = () => {
    switch (role.id) {
      case 'coach':
        return <Trophy className="w-6 h-6 text-amber-400" />;
      case 'player':
        return <UserCheck className="w-6 h-6 text-blue-400" />;
      case 'scout':
        return <Target className="w-6 h-6 text-emerald-400" />;
      default:
        return <Shield className="w-6 h-6 text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    switch (role.id) {
      case 'coach':
        return 'hover:border-amber-500/50 hover:shadow-amber-900/20';
      case 'player':
        return 'hover:border-blue-500/50 hover:shadow-blue-900/20';
      case 'scout':
        return 'hover:border-emerald-500/50 hover:shadow-emerald-900/20';
      default:
        return 'hover:border-slate-700';
    }
  };

  return (
    <>
      <div
        className={`sports-card p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${getBorderColor()}`}
      >
        {/* Subtle accent highlight on top */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
            role.id === 'coach'
              ? 'bg-amber-500'
              : role.id === 'player'
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shrink-0">
              {getRoleIcon()}
            </div>
            <Badge variant={role.badgeVariant} size="md">
              {role.badge}
            </Badge>
          </div>

          <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
            {role.title}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1 mb-3">
            {role.tagline}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {role.description}
          </p>

          {/* Core Capabilities */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Key Capabilities & Responsibilities:
            </h4>
            {role.responsibilities.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">{item.title}: </span>
                  <span className="text-slate-400">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Strict Competition Rules */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs mb-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Strict Rule Enforcement</span>
            </div>
            <ul className="space-y-1.5 text-slate-400">
              {role.rules.map((rule, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            {role.id.toUpperCase()} • READY FOR PHASE 2
          </span>
          <Button
            size="sm"
            variant={role.id === 'scout' ? 'primary' : 'secondary'}
            onClick={() => setIsOpenModal(true)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {role.primaryActionText}
          </Button>
        </div>
      </div>

      {/* Role Preview Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                {getRoleIcon()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{role.title}</h3>
                <p className="text-xs text-slate-400">{role.tagline}</p>
              </div>
            </div>

            <div className="space-y-4 my-6 text-sm text-slate-300">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                  Phase 1 Status Notice
                </p>
                <p className="text-xs text-slate-300">
                  You are previewing the architecture of the {role.title}. Authentication and credentials
                  handling will be connected in <strong>Phase 2</strong> in alignment with the competition roadmap.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Detailed Workflow Responsibilities:</h4>
                <div className="space-y-2">
                  {role.responsibilities.map((resp, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <p className="text-xs font-bold text-emerald-400">{resp.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{resp.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button size="sm" variant="secondary" onClick={() => setIsOpenModal(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

