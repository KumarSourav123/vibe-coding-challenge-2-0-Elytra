import Link from "next/link";
import Icon from "@/frontend/components/ui/Icon";

/**
 * Standard header for every app page, so titles, descriptions and actions
 * line up identically across screens.
 */
export default function PageHeader({ title, description, actions, backHref, backLabel = "Back", meta }) {
  return (
    <header className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <Icon name="chevronLeft" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
          {meta && <div className="mt-3">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
