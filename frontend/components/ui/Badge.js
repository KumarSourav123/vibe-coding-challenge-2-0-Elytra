import { cn } from "@/frontend/utils/cn";

const TONES = {
  neutral: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  success: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  danger: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  warning: { badge: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  info: { badge: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
};

/** Small status label, e.g. Active / Ready / Closed. `dot` adds a status dot. */
export default function Badge({ tone = "neutral", dot = false, className, children }) {
  const styles = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        styles.badge,
        className
      )}
    >
      {dot && <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />}
      {children}
    </span>
  );
}
