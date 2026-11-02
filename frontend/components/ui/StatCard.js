import { cn } from "@/frontend/utils/cn";
import Icon from "./Icon";

/** Compact metric tile. `value` of null renders a loading placeholder. */
export default function StatCard({ label, value, hint, icon, className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200/80 bg-white p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70">
            <Icon name={icon} />
          </span>
        )}
      </div>
      {value === null ? (
        <div aria-hidden="true" className="mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
