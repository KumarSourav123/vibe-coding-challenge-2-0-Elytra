import { cn } from "@/frontend/utils/cn";

/** Loading indicator. Pass `label` for screen readers. */
export default function Spinner({ className, label = "Loading" }) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={cn("h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700", className)}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-width loading row used while a page section fetches. */
export function LoadingBlock({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-slate-500">
      <Spinner label={label} /> {label}...
    </div>
  );
}
