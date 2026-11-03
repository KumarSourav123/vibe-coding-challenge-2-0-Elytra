import { normalizeSport } from "@/backend/utils/sport";
import { createValidator } from "./common";

const READINESS_FILTERS = ["all", "ready", "not_ready"];

/** GET /api/coach/dashboard query (docs/API_CONTRACTS.md §2.22). */
export function validateCoachDashboardQuery(searchParams) {
  const v = createValidator();
  const readiness = searchParams.get("readiness") || "all";
  if (!READINESS_FILTERS.includes(readiness)) v.add("readiness", "Readiness must be all, ready or not_ready");
  v.throwIfErrors();
  return { readiness, sport: normalizeSport(searchParams.get("sport") || "") || null };
}

/** GET /api/scout/players query (§2.25). */
export function validateScoutQuery(searchParams) {
  return { sport: normalizeSport(searchParams.get("sport") || "") || null };
}
