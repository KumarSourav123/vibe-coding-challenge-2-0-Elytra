import Link from "next/link";
import Container from "@/frontend/components/ui/Container";
import Logo from "@/frontend/components/ui/Logo";
import UserMenu from "@/frontend/features/auth/components/UserMenu";

const LINKS = [
  { href: "/#roles", label: "Roles" },
  { href: "/#readiness", label: "Readiness" },
  { href: "/#status", label: "Status" },
];

/** Header for public pages. Signed-in users manage their account inside the app shell. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-8">
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <UserMenu />
        </div>
      </Container>
    </header>
  );
}
