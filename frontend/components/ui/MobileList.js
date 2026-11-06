import Link from "next/link";
import { cn } from "@/frontend/utils/cn";
import Icon from "./Icon";

/**
 * Phone layout for list screens: one tappable card per row, shown below the
 * `md` breakpoint. Pair it with a table wrapped in `hidden md:block`.
 */
export function MobileList({ children }) {
  return <ul className="divide-y divide-slate-100 text-sm md:hidden">{children}</ul>;
}

/**
 * One card in a MobileList.
 * @param {{ href: string, leading?: React.ReactNode, align?: "center"|"start", chevron?: boolean }} props
 */
export function MobileListItem({ href, leading, align = "center", chevron = true, children }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex gap-3 px-4 py-3.5 transition-colors active:bg-slate-50",
          align === "start" ? "items-start" : "items-center"
        )}
      >
        {leading}
        <div className="min-w-0 flex-1">{children}</div>
        {chevron && <Icon name="chevronRight" className="shrink-0 text-slate-300" />}
      </Link>
    </li>
  );
}
