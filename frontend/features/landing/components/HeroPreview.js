import Avatar from "@/frontend/components/ui/Avatar";
import Badge from "@/frontend/components/ui/Badge";

const SAMPLE = { name: "Asha Rao", sport: "Cricket", attendance: 82, matches: 3 };

function Meter({ label, value, display, target }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900 tabular-nums">{display}</span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(value, 100)}%` }} />
        <span
          aria-hidden="true"
          className="absolute -top-1 h-3.5 w-px bg-brand-500"
          style={{ left: `${target}%` }}
        />
      </div>
    </div>
  );
}

/** Illustrative readiness card for the landing hero (static sample data, labelled as such). */
export default function HeroPreview() {
  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-linear-to-br from-brand-50 via-white to-slate-100" />
      <figure className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-raised sm:p-6">
        <div className="flex items-center gap-3">
          <Avatar name={SAMPLE.name} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{SAMPLE.name}</p>
            <p className="text-xs text-slate-500">{SAMPLE.sport}</p>
          </div>
          <Badge tone="success" dot>
            Ready
          </Badge>
        </div>
        <div className="mt-6 space-y-5">
          <Meter label="Attendance" value={SAMPLE.attendance} display={`${SAMPLE.attendance}%`} target={75} />
          <Meter label="Matches played" value={(SAMPLE.matches / 4) * 100} display={SAMPLE.matches} target={50} />
        </div>
        <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Thresholds: 75% attendance · 2 matches</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">Example</span>
        </figcaption>
      </figure>
    </div>
  );
}
