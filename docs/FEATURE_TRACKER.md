# Feature Tracker

Statuses: `PENDING` · `IN PROGRESS` · `TESTING` · `READY FOR INTEGRATION` · `INTEGRATED` · `COMPLETE`

Update this file whenever a status changes. Last updated: 2026-11-06.

| # | Feature | Phase | API contract | Backend | Frontend | Independent testing | Integration | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Project setup & folder architecture | 1 | N/A | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 2 | MongoDB connection utility | 1 | N/A | COMPLETE | N/A | COMPLETE | INTEGRATED | COMPLETE |
| 3 | Initial models (User, Player, Session, Match) | 1 | N/A | COMPLETE | N/A | COMPLETE | N/A | COMPLETE |
| 4 | Health check `GET /api/health` | 1 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 5 | Landing page, role cards, reusable UI | 1 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 6 | Authentication & roles | 2 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7 | Player management (create with login, list, view, edit, reset password) | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7a | Coach/Scout registration with access codes (replaced by academy join codes, see 13a) | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7b | First-login password change + change password | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 8 | Practice sessions & attendance | 4 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 8a | UI redesign (app shell, design system) | 3→4 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 9 | Matches & scoring | 5 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 10 | Readiness calculation | 6 | IMPLEMENTED | COMPLETE | N/A | COMPLETE | INTEGRATED | COMPLETE |
| 11 | Coach dashboard (readiness board + player performance) | 6 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 12 | Player dashboard (own data only) | 6 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13 | Scout dashboard (Ready only) | 6 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13a | Multi-academy (create / join with codes, isolation, migration) | 6+ | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13b | Evaluation mode (demo codes and logins shown to judges behind `EVALUATION_MODE`) | 7 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13c | Branding (AthleteIQ) and guided tour (onboarding) | 7 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13d | Code-quality pass (shared helpers, stricter lint, docs refresh) | 7 | N/A | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 13e | Evaluator popup introducing the multi-academy bonus feature (evaluation mode only) | 7 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 14 | Compulsory competition test cases (1–11) | 7 | N/A | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | TESTING (final check on Vercel in Phase 7) |
| 15 | Production deployment (Vercel) | 7 | N/A | PENDING | PENDING | PENDING | PENDING | PENDING |

## Phase 1 verification log (2026-11-02)

- `npm run lint`: no errors.
- `npm test`: 6 files, 33 tests passed (includes integration against a real in-memory MongoDB).
- `npm run build`: succeeded (`/` static, `/api/health` dynamic).
- `next start`, no database → `/api/health` 503 `DB_NOT_CONFIGURED`; `/` 200.
- `next start` + MongoDB → `/api/health` 200 `connected`.
- Atlas connectivity confirmed by the team.

## Phase 2 verification log (2026-11-02)

Auth is built with Node/Web Crypto only (scrypt + HMAC-SHA256 tokens). No auth SDK or new dependency.

- `npm run lint`: no errors. `npm run build`: succeeded (Proxy registered).
- `npm test`: 12 files, 95 tests passed. New suites: `password`, `authToken`, `authValidator`, `auth.integration` (real in-memory MongoDB), `proxy`, frontend `authApi`.
- Live check (`next start` + MongoDB + `npm run seed`):
  - Seed creates coach, scout and player accounts. A re-run skips existing accounts. It refuses a weak `SEED_PASSWORD` and `NODE_ENV=production`.
  - Anonymous `/coach`, `/player`, `/scout` → 307 `/login?next=…`.
  - Wrong password → 401 `INVALID_CREDENTIALS`.
  - Coach login → 200 with `Set-Cookie: sa_session=…; HttpOnly; SameSite=lax; Secure`. `/api/auth/me` → 200.
  - Coach on `/player` or `/scout` → 307 `/coach`. Signed-in user on `/login` → home.
  - Player login returns its linked `playerId`. Player on `/coach` → 307 `/player`.
  - Logout clears the cookie (`Max-Age=0`). `/me` afterwards → 401.
- Not yet done: a manual click-through of the login form in a browser, and running the seed against Atlas.

## Phase 3 verification log (2026-11-02)

Decisions: one shared academy. The Coach creates each player's login (temporary password, which must be changed at first sign-in). Coach and Scout self-register with access codes. Sport names are normalized (Q2, Q8–Q10 in API_CONTRACTS.md).

- `npm run lint`: no errors. `npm run build`: succeeded.
- `npm test`: 18 files, 165 tests passed. New suites: `players.integration` (includes **compulsory test 1**), `account.integration` (register, change password), `playerValidator`, `sport`, plus additions to `proxy`, frontend `apiClient`, `playersApi` and `authApi`.
- Live check (`next start` + MongoDB):
  - Coach registration: wrong code → 403 `INVALID_ACCESS_CODE`, right code → 201 with session. `role: PLAYER` → 400.
  - The coach created 3 players (201 each). `?sport=CRICKET` returned all three as `Cricket`. PATCH age → 17.
  - The new player logs in with `mustChangePassword: true`:
    - `/player` → 307 `/account/password`.
    - `/api/players` → 403 `PASSWORD_CHANGE_REQUIRED`.
    - After the change: `/player` → 200, and coach APIs → 403 `FORBIDDEN`.
  - Coach reset password → the player's old session `/me` → 401. A deactivated player's login → 403 `ACCOUNT_DISABLED`.
  - Pages `/coach/players`, `/coach/players/new` and `/coach/players/:id` → 200 for a coach. Anonymous → redirect to login.
- Not yet done: a browser click-through of the new pages.

## Phase 4 verification log (2026-11-02)

Rules: eligible = active and same sport (Q1). A session closes only when every eligible player is marked (Q12). Closed sessions are immutable. One record per player (upsert).

- `npm run lint`: no errors. `npm run build`: succeeded.
- `npm test`: 21 files, 205 tests passed. New suites: `sessions.integration` (**compulsory tests 2–4**, immutability, eligibility, roster freezing), `sessionValidator` (with date helpers), frontend `sessionsApi`.
- Live check (`next start` + MongoDB):
  - Created 3 cricket players and a session dated 2026-11-02 (`summary.eligible: 3`). A footballer was rejected with "Fiona Football plays Football, not Cricket".
  - Marked 2 present; closing then gave 409 `ATTENDANCE_INCOMPLETE` naming Chen Li.
  - Marked Chen absent. The roster shows Chen as `ABSENT`.
  - Close → 200 `CLOSED`. A later attendance edit → 409 `SESSION_CLOSED`.
  - Pages `/coach/sessions`, `/new` and `/:id` → 200. Anonymous → redirect to login.
- Not yet done: a browser click-through of the session pages.

## Phase 5 verification log (2026-11-03)

Rule (Q3, the team's decision): a match participant must be active, play the same sport, and be PRESENT in a **CLOSED** session on the same date. Open sessions never count.

- `npm run lint`: no errors. `npm run build`: succeeded.
- `npm test`: 24 files, 232 tests passed. New suites:
  - `matches.integration`: **compulsory tests 5–7**, open-session rejection, other date/sport, inactive, multiple sessions per day, duplicates, PATCH re-validation, authorization.
  - `matchValidator`.
  - Frontend `matchesApi` (with participant helpers).
- Live check (`next start` + MongoDB): ran compulsory tests 1–7 end to end.
  - While the session was OPEN: eligible lookup `{closed:0, open:1}`, and creating a match gave 400 "Arjun Mehta was not marked present in a closed Cricket session…".
  - After close: eligible = Arjun and Bela.
  - Match including Chen → 400 "Chen Li was absent on 2026-11-02". Match with Arjun 55 and Bela 32 → 201 (`totalScore 87`).
  - PATCH score → `totalScore 92`.
  - Pages `/coach/matches`, `/new` and `/:id` → 200. Anonymous → redirect to login.
- Not yet done: a browser click-through of the match pages.

## Phase 6 verification log (2026-11-03)

Rule: READY = attendance ≥ 75% of CLOSED sessions (exact integer comparison) AND ≥ 2 matches. Computed on every request from MongoDB aggregations.

- `npm run lint`: no errors. `npm run build`: succeeded.
- `npm test`: 27 files, 260 tests passed. New suites:
  - `readiness`: pure rule, including **compulsory tests 8–9** at the boundaries.
  - `readiness.integration`: real records; open session ignored; **compulsory tests 10–11**; isolation; live recalculation; 401/403/404.
  - Frontend `readinessApi`.
- Live check (`next start` + MongoDB, data created only through the APIs): 3 players, 4 closed sessions, 2 matches.
  - Coach dashboard: Arjun 3/4 = 75% with 2 matches → **READY**. Bela 2/4 = 50% with 2 matches → not ready. Chen 50% with 1 match → not ready.
  - Scout list: only Arjun. Bela's scout detail → 404.
  - Bela calling `/api/player/dashboard?playerId=<Arjun>` still gets only her own data. Her calls to `/api/players/:id/performance`, `/api/players/:id`, scout and coach endpoints → `FORBIDDEN`.
  - Pages `/coach/readiness`, `/coach/players/:id`, `/scout`, `/scout/players/:id` and `/player` → 200. Player → `/scout` redirects to `/player`.
- Not yet done: a browser click-through of the dashboards.

## Multi-academy verification log (2026-11-03)

Decisions (team): anyone can create an academy (becoming its Head Coach). Coaches and scouts join with that academy's join code. Scouts are per academy. One email = one academy. Only the Head Coach manages codes and the name.

- `npm run lint`: no errors. `npm run build`: succeeded.
- `npm test`: 29 files, 273 tests passed.
  - New suites: `academy.integration` (create, join, lookup, Head Coach powers, code rotation, **full cross-academy isolation** for players, sessions, matches, readiness and scout; pre-migration accounts blocked) and `joinCode`.
  - Every existing suite now runs inside a test academy.
- Live check (`next start` + MongoDB):
  - Inserted pre-academy data. The legacy coach was blocked with `ACADEMY_REQUIRED`.
  - `npm run migrate:academy` moved 2 users and 1 player into "Sports Academy" and made the coach its Head Coach. The second run was a no-op ("Nothing to migrate").
  - The legacy coach and player then worked normally.
  - Created "Beta Academy" (201, `isHeadCoach`). Code lookup → "Beta Academy / SCOUT". A scout joined.
  - Beta's coach: 0 players, and the migrated player's id → `NOT_FOUND`.
  - `npm run seed` creates a "Demo Academy" with codes.
- Removed the `COACH_SIGNUP_CODE` / `SCOUT_SIGNUP_CODE` env vars (replaced by per-academy join codes).

## Code-quality pass (2026-11-06)

No behaviour changes. Duplication removed, then everything re-verified.

- **Backend:** one shared `backend/utils/academyScope.js` (`findInAcademyOrThrow`, `assertValidId`, `notFoundError`, `conflictError`) replaces four copies in the player, session, match and readiness services.
- **Frontend:**
  - Shared `buildSportFilterOptions` / `COMMON_SPORTS` (`utils/sport.js`) replaces five copies.
  - `components/ui/Table.js` (`TH_CLASS`, `TableFooter`) replaces five copies.
  - `useCopyToClipboard` replaces three, and `NotFoundCard` + `isNotFoundResult` replaces four.
  - The last `eslint-disable` was removed (health hook).
- **Lint:** `no-unused-vars`, `eqeqeq`, `prefer-const` and `no-var` are now errors, and the code is clean under them.
- **Project:** package renamed to `athleteiq`, `npm run check` added, and the onboarding storage keys renamed to `athleteiq:*`.
- **Docs:** new `docs/README.md` (guide) and `docs/ARCHITECTURE.md`. `BACKEND.md`, `FRONTEND.md` and `README.md` rewritten for the final app.
- **Verification:**
  - `npm run lint` clean, `npm test` 32 files / 283 tests passed, `npm run build` succeeded.
  - Live check: all 19 pages return 200 for the coach, scout, player and guest. The core flow (player → session → close → match) works, and the not-found and invalid-id paths are correct.

## Merge review (2026-11-06)

The merged branch brought **phone-friendly improvements**:
- Lists show as cards on phones.
- The mobile menu closes on navigation and on Escape, and locks page scroll while open.
- Fields are 44px tall on phones, so iOS doesn't zoom in when one is tapped.
- Placeholders and hints were added to forms.

Integration work:
- **Resolved the one conflict** (`CoachReadinessBoard.js`, with the team's approval): kept the shared `TableFooter` and moved the branch's `gap-3` spacing into `TableFooter`, so every table gets it.
- **De-duplicated the new phone cards:** `MobileList` / `MobileListItem` (`components/ui/MobileList.js`) now serve the players, sessions, readiness and scout lists.
- **One attendance rule on the frontend:** `meetsAttendance()` replaces three copies of the threshold check.
- **Verified:** `npm run check` passes (lint clean, 32 files / 284 tests, build OK). Live check: all 17 pages return 200 for coach, scout, player and guest, and the readiness and scout data are correct.

## Surprise requirement (4 Nov, 11:00 IST)

Record it here, then update the roadmap and affected contracts.
