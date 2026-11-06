"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/frontend/components/ui/Button";
import Icon from "@/frontend/components/ui/Icon";
import { APP_NAME } from "@/frontend/utils/config";
import { tourGroupFor } from "../data/tourSteps";
import {
  clearAcademyCreated,
  markTourGroupSeen,
  replayTourGroup,
  setTourMode,
  useOnboarding,
} from "../onboardingStore";

const CARD_WIDTH = 340;
const GAP = 14;

/** Centered modal used by the intro prompt and the "academy created" message. */
function Dialog({ icon, title, children, actions, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-raised sm:p-7"
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-brand-fg">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <h2 id="onboarding-title" className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
      </div>
    </div>
  );
}

function IntroDialog() {
  const decline = () => setTourMode("off");
  return (
    <Dialog
      icon="sparkle"
      title={`New to ${APP_NAME}?`}
      onClose={decline}
      actions={
        <>
          <Button variant="secondary" onClick={decline}>
            No thanks
          </Button>
          <Button autoFocus iconRight="arrowRight" onClick={() => setTourMode("on")}>
            Yes, show me around
          </Button>
        </>
      }
    >
      <p>Would you like a guided walkthrough? We&apos;ll point out what to do, step by step, on each page as you use the site.</p>
      <p className="mt-2 text-xs text-slate-500">You can stop it any time, or replay it later from Tutorial in the menu.</p>
    </Dialog>
  );
}

const NEXT_STEPS = [
  "Open the Academy tab in the sidebar.",
  "Copy the coach and scout join codes.",
  "Send them to the people you want to invite. They choose Join an academy when signing up.",
];

function AcademyCreatedDialog({ name }) {
  const router = useRouter();
  return (
    <Dialog
      icon="checkCircle"
      title={`${name} is ready!`}
      onClose={clearAcademyCreated}
      actions={
        <>
          <Button variant="secondary" onClick={clearAcademyCreated}>
            I&apos;ll do it later
          </Button>
          <Button
            autoFocus
            icon="shield"
            onClick={() => {
              clearAcademyCreated();
              router.push("/coach/academy");
            }}
          >
            Go to Academy
          </Button>
        </>
      }
    >
      <p>You&apos;re the Head Coach. Next, invite your coaches and scouts:</p>
      <ol className="mt-3 space-y-2">
        {NEXT_STEPS.map((text, index) => (
          <li key={text} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
              {index + 1}
            </span>
            <span className="pt-0.5">{text}</span>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}

function findTarget(selectors = []) {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const box = element.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) return element;
    }
  }
  return null;
}

/** Tracks the on-screen box of a step's target. `null` box = no target, show a centered card. */
function useTargetBox(selectors) {
  const key = (selectors ?? []).join("|");
  const [state, setState] = useState({ key: null, box: null });

  useEffect(() => {
    let element = null;
    let tries = 0;
    let timer;
    let frame;

    const measure = () => {
      if (!element) return;
      const { top, left, width, height } = element.getBoundingClientRect();
      setState({ key, box: { top, left, width, height } });
    };
    const locate = () => {
      element = key ? findTarget(key.split("|")) : null;
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        frame = requestAnimationFrame(measure);
        timer = setTimeout(measure, 450);
      } else if (key && tries++ < 12) {
        // Targets inside data-loaded content can appear a moment later.
        timer = setTimeout(locate, 150);
      } else {
        frame = requestAnimationFrame(() => setState({ key, box: null }));
      }
    };

    locate();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [key]);

  return state.key === key ? { ready: true, box: state.box } : { ready: false, box: null };
}

function cardPosition(box) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Phones: dock the card full-width at the edge farther from the highlighted element.
  if (vw < 640) {
    const centre = box.top + box.height / 2;
    return centre > vh / 2 ? { left: 12, right: 12, top: 12 } : { left: 12, right: 12, bottom: 12 };
  }
  const width = Math.min(CARD_WIDTH, vw - 32);
  const left = Math.min(Math.max(box.left, 16), vw - width - 16);
  const below = vh - (box.top + box.height) > 230 || box.top < 230;
  return below ? { width, left, top: Math.min(box.top + box.height + GAP, vh - 220) } : { width, left, bottom: vh - box.top + GAP };
}

/** Steps for one page: spotlight on the target plus a small card with Back / Next. */
function TourRunner({ group }) {
  const [index, setIndex] = useState(0);
  const step = group.steps[index];
  const { ready, box } = useTargetBox(step.target);
  const last = index === group.steps.length - 1;
  const finish = () => markTourGroupSeen(group.id);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && markTourGroupSeen(group.id);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [group.id]);

  if (!ready) return null;

  const card = (
    <div
      role="dialog"
      aria-labelledby="tour-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-raised"
      style={box ? { position: "fixed", ...cardPosition(box) } : { width: "min(380px, calc(100vw - 32px))" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-700 uppercase">
          <Icon name="sparkle" className="h-3 w-3" />
          Guide · {index + 1} of {group.steps.length}
        </span>
        <button
          type="button"
          onClick={() => setTourMode("off")}
          className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          Skip tour
        </button>
      </div>
      <h2 id="tour-title" className="mt-3 text-base font-semibold text-slate-900">
        {step.title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1" aria-hidden="true">
          {group.steps.map((s, i) => (
            <span key={s.title} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand-600" : "w-1.5 bg-slate-200"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setIndex(index - 1)}>
              Back
            </Button>
          )}
          <Button size="sm" autoFocus onClick={last ? finish : () => setIndex(index + 1)}>
            {last ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!box) {
    return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]">{card}</div>;
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <div
        aria-hidden="true"
        className="fixed rounded-xl ring-2 ring-brand-500 transition-all duration-200"
        style={{
          top: box.top - 6,
          left: box.left - 6,
          width: box.width + 12,
          height: box.height + 12,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
        }}
      />
      <div className="pointer-events-auto">{card}</div>
    </div>
  );
}

// Signed-in areas have "Tutorial" in the sidebar; public pages get a floating button instead.
const IN_APP = /^\/(coach|player|scout|account)(\/|$)/;

function TutorialButton({ groupId }) {
  return (
    <button
      type="button"
      onClick={() => replayTourGroup(groupId)}
      className="fixed bottom-4 left-4 z-[80] inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-raised transition-colors hover:text-brand-700"
    >
      <Icon name="sparkle" className="h-3.5 w-3.5 text-brand-600" />
      Tutorial
    </button>
  );
}

/**
 * First-visit walkthrough and onboarding popups, mounted once in the root layout.
 * Order of priority: "academy created" message, then the tour opt-in prompt, then the current page's steps.
 */
export default function Onboarding() {
  const pathname = usePathname();
  const { hydrated, mode, seen, academyName } = useOnboarding();
  if (!hydrated) return null;

  if (academyName && pathname.startsWith("/coach")) return <AcademyCreatedDialog name={academyName} />;
  if (!mode) return <IntroDialog />;

  const group = tourGroupFor(pathname);
  if (!group) return null;
  if (mode === "on" && !seen.includes(group.id)) return <TourRunner key={group.id} group={group} />;
  return IN_APP.test(pathname) ? null : <TutorialButton groupId={group.id} />;
}
