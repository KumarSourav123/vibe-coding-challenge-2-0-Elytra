import Icon from "@/frontend/components/ui/Icon";

export default function RoleCard({ title, tagline, icon, capabilities }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white">
        <Icon name={icon} />
      </span>
      <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{tagline}</p>
      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
        {capabilities.map((item) => (
          <li key={item} className="flex gap-2.5">
            <Icon name="check" className="mt-0.5 text-brand-600" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
