import Link from "next/link";
import { cn } from "@/frontend/utils/cn";
import Icon from "./Icon";

const VARIANTS = {
  primary: "bg-brand-600 text-brand-fg shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:outline-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400",
  danger: "bg-white text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-50 focus-visible:outline-rose-500",
};

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
};

/**
 * Reusable button. Renders a Next.js <Link> when `href` is provided,
 * otherwise a native <button>. `icon` / `iconRight` take an Icon name.
 */
export default function Button({
  variant = "primary",
  size = "md",
  href,
  icon,
  iconRight,
  className,
  children,
  type = "button",
  ...props
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  const content = (
    <>
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
