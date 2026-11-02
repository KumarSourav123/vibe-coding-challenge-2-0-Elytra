import Link from "next/link";
import Icon from "@/frontend/components/ui/Icon";
import Logo from "@/frontend/components/ui/Logo";

/** Focused layout for sign-in and sign-up: logo, centered form, nothing else. */
export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--color-brand-50),transparent_70%)]"
      />
      <header className="relative flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900">
          <Icon name="chevronLeft" />
          Home
        </Link>
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:pt-16">{children}</main>
    </div>
  );
}
