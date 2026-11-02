import { cn } from "@/frontend/utils/cn";

const TONES = {
  danger: "border-rose-200 bg-rose-50/70 text-rose-900",
  warning: "border-amber-200 bg-amber-50/70 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
};

/** Inline message banner. Danger alerts are announced to screen readers immediately. */
export default function Alert({ tone = "info", title, className, children }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm leading-relaxed", TONES[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1 opacity-90" : undefined}>{children}</div>}
    </div>
  );
}
