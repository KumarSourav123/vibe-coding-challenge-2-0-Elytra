import { useId } from "react";
import { cn } from "@/frontend/utils/cn";
import Icon from "./Icon";

// 16px text on phones stops iOS Safari from zooming the page when a field is tapped; 14px from `sm` up.
export const FIELD_BASE =
  "block h-11 w-full rounded-lg border bg-white px-3 text-base text-slate-900 shadow-xs transition-colors sm:h-10 sm:text-sm " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export const FIELD_STATE = {
  normal: "border-slate-200 focus:border-slate-400 focus:ring-slate-900/5",
  error: "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10",
};

/** Labelled text input with optional leading icon, hint and error (wired up with aria). */
export default function Input({ label, error, hint, icon, className, id, ...props }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Icon name={icon} />
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(FIELD_BASE, error ? FIELD_STATE.error : FIELD_STATE.normal, icon && "pl-9")}
          {...props}
        />
      </div>
      {message && (
        <p id={messageId} className={cn("mt-1.5 text-xs", error ? "text-rose-600" : "text-slate-500")}>
          {message}
        </p>
      )}
    </div>
  );
}
