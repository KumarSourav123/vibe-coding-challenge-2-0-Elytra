import Link from "next/link";

/** Card used by the sign-in, sign-up and change-password screens. */
export default function AuthCard({ title, description, children, footer }) {
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-raised sm:p-8">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
    </div>
  );
}

export function AuthFooterLink({ prompt, href, label }) {
  return (
    <>
      {prompt}{" "}
      <Link href={href} className="font-medium text-slate-900 underline-offset-4 hover:underline">
        {label}
      </Link>
    </>
  );
}
