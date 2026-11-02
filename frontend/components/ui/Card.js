import { Children } from "react";
import { cn } from "@/frontend/utils/cn";

/**
 * Surface container.
 * - Plain: <Card>...</Card> (padded).
 * - With header: <Card title="..." description="..." action={<Button/>}>...</Card>
 *   renders a header row, then the body (divided only when there is a body).
 * - `padding={false}` for edge-to-edge content such as tables and lists.
 */
export default function Card({
  as: Component = "div",
  title,
  description,
  action,
  padding = true,
  className,
  bodyClassName,
  children,
  ...props
}) {
  const hasHeader = title || description || action;
  const hasBody = Children.toArray(children).length > 0;

  return (
    <Component
      className={cn("rounded-xl border border-slate-200/80 bg-white shadow-card", className)}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6",
            hasBody && "border-b border-slate-100"
          )}
        >
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      {hasBody && <div className={cn(padding && "p-5 sm:p-6", bodyClassName)}>{children}</div>}
    </Component>
  );
}
