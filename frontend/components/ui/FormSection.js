/**
 * Settings-style form section: title and description on the left, fields on
 * the right (stacked on mobile). Consecutive sections are divided by a rule.
 */
export default function FormSection({ title, description, children }) {
  return (
    <section className="grid gap-x-8 gap-y-4 border-t border-slate-100 px-5 py-6 first:border-t-0 sm:px-6 md:grid-cols-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
  );
}

/** Right-aligned action bar at the bottom of a sectioned form. */
export function FormActions({ children }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
      {children}
    </div>
  );
}
