import Container from "@/frontend/components/ui/Container";
import Logo from "@/frontend/components/ui/Logo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <Container className="flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-sm" />
        <p>Attendance, matches and readiness, in one place.</p>
      </Container>
    </footer>
  );
}
