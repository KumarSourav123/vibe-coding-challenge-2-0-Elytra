"use client";

import { useState } from "react";
import Button from "@/frontend/components/ui/Button";
import Icon from "@/frontend/components/ui/Icon";

/**
 * Login details for the coach to pass to a player. The password is only
 * known on this screen; the server never returns it.
 */
export default function CredentialsCard({ name, email, password, title }) {
  const [copied, setCopied] = useState(false);
  const text = `Sports Academy login for ${name}\nEmail: ${email}\nTemporary password: ${password}\nYou will be asked to choose a new password when you first sign in.`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title ?? `${name} is ready to sign in`}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Share these details with the player. The password won&apos;t be shown again.
          </p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Email</dt>
          <dd className="font-mono break-all text-slate-900">{email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-slate-500">Temporary password</dt>
          <dd className="font-mono break-all text-slate-900">{password}</dd>
        </div>
      </dl>

      <Button variant="secondary" size="sm" icon={copied ? "check" : "copy"} className="mt-4" onClick={handleCopy}>
        {copied ? "Copied" : "Copy details"}
      </Button>
    </div>
  );
}
