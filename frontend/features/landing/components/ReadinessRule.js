import SectionHeading from "@/frontend/components/layout/SectionHeading";

const RULES = [
  { value: "75%", label: "Attendance", detail: "Present in at least three of every four completed practice sessions." },
  { value: "2", label: "Matches played", detail: "Selected and scored in at least two matches." },
];

export default function ReadinessRule() {
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 px-6 py-12 sm:px-12">
      <div className="grid gap-10 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-2 [&_h2]:text-white [&_p]:text-slate-400">
          <SectionHeading
            eyebrow="Readiness"
            title="One clear rule for match-ready"
            description="A player is Ready only when both conditions hold. Scouts see Ready players and nobody else."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {RULES.map((rule) => (
            <div key={rule.label} className="rounded-xl bg-white/[0.04] p-6 ring-1 ring-white/10">
              <p className="text-4xl font-semibold tracking-tight text-white tabular-nums">
                {rule.value}
                <span className="ml-1 text-lg text-brand-400">+</span>
              </p>
              <p className="mt-3 text-sm font-medium text-white">{rule.label}</p>
              <p className="mt-1 text-sm text-slate-400">{rule.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
