import Link from "next/link";
import { APP_NAME } from "@/frontend/utils/config";
import { cn } from "@/frontend/utils/cn";

// Brand mark from public/brand/athleteiq-logo.svg. Ink strokes follow the theme's text colour so the mark
// stays visible in dark mode; the lime strokes keep the brand gradient.
function BrandMark({ className }) {
  return (
    <svg viewBox="62 32 254 318" className={className} shapeRendering="geometricPrecision" aria-hidden="true">
      <defs>
        <linearGradient id="athleteiq-lime" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8F34A" />
          <stop offset="1" stopColor="#75D62B" />
        </linearGradient>
      </defs>
      <g transform="translate(44 30)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M145 18 L34 270 H91 L145 146 L199 270 H256 Z" stroke="currentColor" strokeWidth="27" />
        <path d="M145 18 L34 270 H91 L145 146" stroke="url(#athleteiq-lime)" strokeWidth="27" />
        <path d="M110 190 H181" stroke="currentColor" strokeWidth="19" />
        <path d="M191 206 C218 206 238 226 238 251 C238 276 218 296 193 296 C168 296 148 276 148 251" stroke="url(#athleteiq-lime)" strokeWidth="20" />
        <path d="M218 276 L251 309" stroke="currentColor" strokeWidth="18" />
      </g>
    </svg>
  );
}

/** Brand mark + name. Links home by default. A trailing "IQ" in the name gets the lime accent. */
export default function Logo({ href = "/", className, showName = true }) {
  const accent = APP_NAME.endsWith("IQ") ? "IQ" : "";
  const base = APP_NAME.slice(0, APP_NAME.length - accent.length);

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-900", className)}>
      <BrandMark className="h-10 w-auto shrink-0" />
      {showName && (
        <span className="text-lg leading-none font-extrabold tracking-wide uppercase">
          {base}
          {accent && <span className="text-(--logo-lime)">{accent}</span>}
        </span>
      )}
    </Link>
  );
}
