import SectionHeading from "@/frontend/components/layout/SectionHeading";
import Button from "@/frontend/components/ui/Button";
import Container from "@/frontend/components/ui/Container";
import HealthStatus from "@/frontend/features/health/components/HealthStatus";
import HeroPreview from "@/frontend/features/landing/components/HeroPreview";
import ReadinessRule from "@/frontend/features/landing/components/ReadinessRule";
import RoleCards from "@/frontend/features/landing/components/RoleCards";

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(15_23_42/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] bg-size-[48px_48px]"
        />
        <Container className="grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Attendance · Matches · Readiness
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
              Run your sports academy from one place.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-pretty text-slate-500">
              Coaches track practice attendance and match scores, players follow their own progress, and scouts see
              only athletes who are genuinely match-ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" href="/login" iconRight="arrowRight">
                Sign in
              </Button>
              <Button size="lg" variant="secondary" href="/register">
                Create your academy
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroPreview />
          </div>
        </Container>
      </section>

      <section id="roles" className="scroll-mt-16 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Roles"
            title="Built for every role"
            description="Each role sees exactly what it needs, and nothing more."
          />
          <div className="mt-12">
            <RoleCards />
          </div>
        </Container>
      </section>

      <section id="readiness" className="scroll-mt-16 pb-20 sm:pb-24">
        <Container>
          <ReadinessRule />
        </Container>
      </section>

      <section id="status" className="scroll-mt-16 border-t border-slate-200/70 bg-slate-50 py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="System status"
            title="Live service health"
            description="Checked against the backend health endpoint each time you load this page."
          />
          <div className="mt-8">
            <HealthStatus />
          </div>
        </Container>
      </section>
    </>
  );
}
