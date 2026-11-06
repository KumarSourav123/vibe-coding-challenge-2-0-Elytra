import { cn } from "@/frontend/utils/cn";
import Icon from "./Icon";

/** Compact metric tile. `value` of null renders a loading placeholder. */
export default function StatCard({ label, value, hint, icon, className }) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-card sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
        {icon && (
          <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70 sm:grid">
            <Icon name={icon} />
          </span>
        )}
      </div>
      {value === null ? (
        <div aria-hidden="true" className="mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:mt-2 sm:text-3xl">{value}</p>
      )}
      {hint && <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{hint}</p>}
    </div>
  );
}
