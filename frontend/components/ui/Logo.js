import Link from "next/link";
import { APP_NAME } from "@/frontend/utils/config";
import { cn } from "@/frontend/utils/cn";

/** Brand mark + name. Links home by default. */
export default function Logo({ href = "/", className, showName = true }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-900", className)}>
      <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4.5 9.5c3 1.5 12 1.5 15 0M4.5 14.5c3-1.5 12-1.5 15 0" />
        </svg>
      </span>
      {showName && <span>{APP_NAME}</span>}
    </Link>
  );
}
