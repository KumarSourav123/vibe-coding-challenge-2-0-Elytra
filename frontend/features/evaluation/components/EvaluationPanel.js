"use client";

import Icon from "@/frontend/components/ui/Icon";
import { ROLE_LABELS } from "@/frontend/features/auth/data/roleLabels";
import { useApiQuery } from "@/frontend/hooks/useApiQuery";
import { useCopyToClipboard } from "@/frontend/hooks/useCopyToClipboard";
import { getEvaluationInfo } from "../api/evaluationApi";

function CopyButton({ value }) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-amber-900 hover:bg-amber-100"
    >
      <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function UseButton({ onClick, label = "Use" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center rounded-md bg-amber-900 px-2.5 text-xs font-medium text-white hover:bg-amber-800"
    >
      {label}
    </button>
  );
}

function Row({ label, value, mono = true, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-amber-200">
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-amber-800 uppercase">{label}</p>
        <p className={`truncate text-sm text-slate-900 ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
      </div>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}

/**
 * Competition-only helper. When the server runs with EVALUATION_MODE=true it
 * shows the demo academy's join codes (variant "join") or the demo logins
 * (variant "login") for copy-paste; otherwise it renders nothing.
 *
 * @param {{ variant: "join"|"login", onUseCode?: (code: string) => void,
 *           onUseAccount?: (credentials: { email: string, password: string }) => void }} props
 */
export default function EvaluationPanel({ variant, onUseCode, onUseAccount }) {
  const { result } = useApiQuery("evaluation-info", () => getEvaluationInfo());
  if (!result?.ok) return null;

  const { academy, joinCodes, demoAccounts, demoPassword } = result.data;
  const showJoin = variant === "join" && joinCodes;
  const showLogin = variant === "login" && demoAccounts.length > 0 && demoPassword;
  if (!showJoin && !showLogin) return null;

  return (
    <section aria-label="Evaluation codes" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <Icon name="key" className="mt-0.5 text-amber-700" />
        <div>
          <p className="text-sm font-semibold text-amber-900">For evaluation only</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            {showJoin
              ? `These are the join codes of "${academy.name}", shown here so judges can copy-paste them. In normal use they are kept secret by the academy's Head Coach.`
              : `Ready-made demo logins in "${academy.name}", shown here so judges can sign in quickly. In normal use these are kept secret.`}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {showJoin &&
          [
            ["Coach join code", joinCodes.coach],
            ["Scout join code", joinCodes.scout],
          ].map(([label, code]) => (
            <Row
              key={label}
              label={label}
              value={code}
              actions={
                <>
                  <CopyButton value={code} />
                  {onUseCode && <UseButton onClick={() => onUseCode(code)} />}
                </>
              }
            />
          ))}

        {showLogin && (
          <>
            {demoAccounts.map((account) => (
              <Row
                key={account.email}
                label={ROLE_LABELS[account.role] ?? account.role}
                value={account.email}
                actions={
                  <>
                    <CopyButton value={account.email} />
                    {onUseAccount && (
                      <UseButton onClick={() => onUseAccount({ email: account.email, password: demoPassword })} />
                    )}
                  </>
                }
              />
            ))}
            <Row label="Password (all demo accounts)" value={demoPassword} actions={<CopyButton value={demoPassword} />} />
          </>
        )}
      </div>
    </section>
  );
}
