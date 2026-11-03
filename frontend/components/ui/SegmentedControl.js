import { cn } from "@/frontend/utils/cn";

/**
 * Compact tab-style selector (e.g. All / Open / Closed).
 * `fullWidth` stretches it with equal-width segments.
 * @param {{ options: Array<{ value: string, label: string }>, value: string, onChange: (value: string) => void, label: string, fullWidth?: boolean }} props
 */
export default function SegmentedControl({ options, value, onChange, label, fullWidth = false, className }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("rounded-lg bg-slate-100 p-1", fullWidth ? "grid w-full" : "inline-flex", className)}
      style={fullWidth ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
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
