import { cn } from "@/frontend/utils/cn";

/** Eyebrow + title + description block for public page sections. */
export default function SectionHeading({ eyebrow, title, description, align = "left", className }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="text-sm font-medium text-brand-700">{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base text-slate-500">{description}</p>}
    </div>
  );
}
