"use client";

import { useSyncExternalStore } from "react";

// Browser-only onboarding state.
// - localStorage  "athleteiq:onboarding": { mode: "on" | "off", seen: [tourGroupId] }  (mode missing = not asked yet)
// - sessionStorage "athleteiq:new-academy": name of an academy created in this tab, until its popup is dismissed
const TOUR_KEY = "athleteiq:onboarding";
const ACADEMY_KEY = "athleteiq:new-academy";

const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(area, key) {
  try {
    return window[area].getItem(key);
  } catch {
    return null;
  }
}

function write(area, key, value) {
  try {
    if (value == null) window[area].removeItem(key);
    else window[area].setItem(key, value);
  } catch {
    // Storage blocked (private mode etc.): onboarding just won't persist.
  }
  emit();
}

function parseTour(raw) {
  try {
    const value = JSON.parse(raw);
    return { mode: value?.mode ?? null, seen: Array.isArray(value?.seen) ? value.seen : [] };
  } catch {
    return { mode: null, seen: [] };
  }
}

const readTour = () => parseTour(read("localStorage", TOUR_KEY));
const saveTour = (tour) => write("localStorage", TOUR_KEY, JSON.stringify(tour));

/** `hydrated` is false during server render and the first client render. */
export function useOnboarding() {
  const tourRaw = useSyncExternalStore(subscribe, () => read("localStorage", TOUR_KEY) ?? "", () => undefined);
  const academyName = useSyncExternalStore(subscribe, () => read("sessionStorage", ACADEMY_KEY), () => undefined);
  if (tourRaw === undefined) return { hydrated: false, mode: null, seen: [], academyName: null };
  return { hydrated: true, ...parseTour(tourRaw), academyName };
}

export function setTourMode(mode) {
  saveTour({ ...readTour(), mode });
}

export function markTourGroupSeen(id) {
  const tour = readTour();
  if (!tour.seen.includes(id)) saveTour({ ...tour, seen: [...tour.seen, id] });
}

/** Turn the tour on and replay the given page's steps. */
export function replayTourGroup(id) {
  const tour = readTour();
  saveTour({ mode: "on", seen: tour.seen.filter((seenId) => seenId !== id) });
}

export function markAcademyCreated(name) {
  write("sessionStorage", ACADEMY_KEY, name || "Your academy");
}

export function clearAcademyCreated() {
  write("sessionStorage", ACADEMY_KEY, null);
}
