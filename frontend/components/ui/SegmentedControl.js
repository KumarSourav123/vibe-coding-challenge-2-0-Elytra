import { cn } from "@/frontend/utils/cn";

/**
 * Compact tab-style selector (e.g. All / Open / Closed).
 * @param {{ options: Array<{ value: string, label: string }>, value: string, onChange: (value: string) => void, label: string }} props
 */
export default function SegmentedControl({ options, value, onChange, label, className }) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-lg bg-slate-100 p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition-all",
              active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
