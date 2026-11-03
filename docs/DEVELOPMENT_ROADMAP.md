# Development Roadmap

Seven phases, one per competition day. Each phase leaves the app deployable. **FE** = Frontend developer, **BE** = Backend developer.

| Day | Phase | Milestone |
| --- | --- | --- |
| 1 | Project Foundation | App runs, health check shows live DB status |
| 2 | Authentication & Roles | All three roles can log in and land on their area |
| 3 | Player Management | Coach can create, list, view and edit players |
| 4 | Sessions & Attendance | Coach marks attendance and closes sessions. **Surprise requirement: 4 Nov, 11:00 IST** |
| 5 | Matches & Scoring | Coach creates matches with valid participants and scores |
| 6 | Readiness & Role Access | Dashboards for all roles, readiness from real data |
| 7 | Testing, UI & Deployment | Compulsory tests pass, live on Vercel |

Every phase ends with: `npm run lint && npm test && npm run build` passing, the tracker updated, and a manual daily commit and push.

---

## Phase 1 – Project Foundation ✅

**Objective:** a clean, running foundation both developers can extend.

| Task | Owner | Output | Status |
| --- | --- | --- | --- |
| 1.1 Next.js + Tailwind + ESLint + Vitest setup | Shared | `package.json`, configs | Done |
| 1.2 Folder architecture | Shared | `app/`, `backend/`, `frontend/`, `lib/`, `tests/`, `docs/` | Done |
| 1.3 MongoDB connection utility (cached, serverless-safe) | BE | `lib/mongodb.js` | Done |
| 1.4 Initial models: User, Player, Session, Match | BE | `backend/models/*` | Done |
| 1.5 Response and error helpers | BE | `backend/utils/apiResponse.js`, `errors.js` | Done |
| 1.6 `GET /api/health` | BE | `app/api/health/route.js`, `healthService.js` | Done |
| 1.7 Layout, landing page, role cards | FE | `app/layout.js`, `app/page.js`, `frontend/features/landing` | Done |
| 1.8 Reusable UI components | FE | `frontend/components/ui/*` | Done |
| 1.9 Health status component (loading / connected / disconnected) | FE | `frontend/features/health/*` | Done |
| 1.10 Documentation | BE (+FE guide) | `docs/*` | Done |

**Dependencies:** none. **Testing:** unit tests for helpers and models, route tests without a DB, integration tests with in-memory MongoDB, frontend health client tests. **Completion criteria:** lint, tests and build pass, the landing page shows real DB status, and the docs are ready for Phase 2. One item remains: verify against Atlas once `.env.local` exists.

---

## Phase 2 – Authentication and Role Management ✅

**Objective:** secure login for COACH, PLAYER and SCOUT, with role-based routing and protected APIs.

**Implemented without any auth SDK.** Task 2.2 below was changed accordingly: no `bcryptjs` or `jose`. Password hashing uses scrypt from `node:crypto`, and tokens are HMAC-SHA256 via Web Crypto (`lib/authToken.js`). Only `AUTH_SECRET` (and the dev-only `SEED_PASSWORD`) were added to `.env.example`. Task 2.7 was built as `scripts/seed.mjs` (`npm run seed`).

| Task | Owner | Depends on | Output |
| --- | --- | --- | --- |
| 2.1 Finalize auth contract (login/logout/me, cookie/session format, Q8) | BE + FE | — | `API_CONTRACTS.md` → AGREED |
| 2.2 Choose and add auth deps (e.g. `bcryptjs`, `jose`), add `AUTH_SECRET` to `.env.example` | BE (shared file) | 2.1 | Dependencies + env |
| 2.3 Password hashing utility | BE | 2.2 | `backend/utils/password.js` |
| 2.4 Session/token handling (HTTP-only, Secure, SameSite cookie) | BE | 2.2 | `backend/services/authService.js` |
| 2.5 `requireAuth` / `requireRole` guards | BE | 2.4 | `backend/middleware/*` |
| 2.6 Login, logout, me routes + validators | BE | 2.3–2.5 | `app/api/auth/*` |
| 2.7 Seed script for demo coach, scout and player users | BE | 2.3 | `scripts/seed.js` (dev only) |
| 2.8 Login page with mocks, error and loading states | FE | 2.1 | `app/login/page.js`, `frontend/features/auth` |
| 2.9 Role-based redirects + route protection for `/coach`, `/player`, `/scout` | FE (+BE for `proxy.js`) | 2.6 | Redirect logic |
| 2.10 Integration | Both | 2.6, 2.8 | Real login works |

**Testing:** valid and invalid login, hashed password stored, unauthenticated → 401, wrong role → 403, logout clears session. **Completion:** each role logs in and lands on its own area. Protected APIs reject others.

---

## Phase 3 – Player Management ✅

**Objective:** Coach can create, list, view and update players.

**Delivered (with the team's decisions):**
- One shared academy.
- The Coach creates the player profile **and** login together, with a temporary password. The player must change it at first sign-in, and the Coach can reset it later.
- Coach and Scout self-register at `/register` with access codes. (Later replaced by per-academy join codes; see Multi-academy below.)
- Any user can change their password at `/account/password`. A password change or reset signs out all other sessions (`sessionVersion`).
- Sport names are normalized everywhere.

| Task | Owner | Depends on | Output |
| --- | --- | --- | --- |
| 3.1 Finalize players contract (resolve Q2 sport matching) | BE + FE | Phase 2 | AGREED contract |
| 3.2 Player validators | BE | 3.1 | `backend/validators/playerValidator.js` |
| 3.3 Player service (create/list/get/update) | BE | 3.2 | `backend/services/playerService.js` |
| 3.4 Routes `POST/GET /api/players`, `GET/PATCH /api/players/:id` (COACH only) | BE | 3.3 | `app/api/players/*` |
| 3.5 Player list, add form, details, edit form (with mocks) | FE | 3.1 | `app/coach/players/*`, `frontend/features/players` |
| 3.6 Integration | Both | 3.4, 3.5 | Real CRUD |

**Testing:** valid create, invalid data → 400, invalid ID → 400, unknown ID → 404, non-coach → 403. **Completion:** compulsory test 1 (create three players) works via the UI.

---

## Phase 4 – Practice Sessions and Attendance ✅

**Objective:** Coach creates sessions, marks eligible players PRESENT/ABSENT and closes sessions. Closed sessions are immutable.

**Delivered:**
- **Endpoints:** `POST/GET /api/sessions`, `GET /api/sessions/:id` (with roster), `POST /api/sessions/:id/attendance` (all-or-nothing upsert), `POST /api/sessions/:id/close` (only when every eligible player is marked).
- **Concurrency:** writes compare-and-set on `{ status: OPEN, __v }`, so a closed session can't be changed even by a racing request.
- **UI:** `/coach/sessions` (status tabs, sport filter, progress), `/coach/sessions/new` (live eligible-player count), `/coach/sessions/:id` (Present/Absent toggles, "All present", unsaved-change tracking, confirm-to-close, locked roster once closed).
- **Coach overview:** now shows open and closed session counts.

| Task | Owner | Depends on | Output |
| --- | --- | --- | --- |
| 4.1 Finalize sessions contract (Q1, Q7) | BE + FE | Phase 3 | AGREED contract |
| 4.2 Session service: create, list, get with eligible players | BE | 4.1 | `sessionService.js` |
| 4.3 Mark attendance (eligible players only, upsert per player, rejected if CLOSED → 409 `SESSION_CLOSED`) | BE | 4.2 | `POST /api/sessions/:id/attendance` |
| 4.4 Close session (atomic `OPEN → CLOSED`, sets `closedAt`) | BE | 4.2 | `POST /api/sessions/:id/close` |
| 4.5 Session list, create form, attendance marking UI, closed state (read-only) | FE | 4.1 | `app/coach/sessions/*` |
| 4.6 Integration | Both | 4.3–4.5 | |

**Testing:** compulsory tests 2–4. Editing a closed session → 409. Duplicate attendance prevented. Ineligible player rejected.

---

## Phase 5 – Match Management and Scoring ✅

**Objective:** matches with participants restricted to same-date, same-sport PRESENT players, with one score each.

**Delivered:**
- **Endpoints:** `GET /api/matches/eligible-players`, `POST/GET /api/matches`, `GET/PATCH /api/matches/:id`.
- **Eligibility** requires PRESENT in a **closed** session that day (Q3). Every create and update is all-or-nothing with per-player reasons.
- **UI:**
  - `/coach/matches`: list with top scorer.
  - `/coach/matches/new`: details, then a picker offering only eligible players, with a score each. It tells the coach to close the session first when needed.
  - `/coach/matches/:id`: stats, scoreboard, and edit (opponent, players, scores).
- **Coach overview:** now shows the match count.

| Task | Owner | Depends on | Output |
| --- | --- | --- | --- |
| 5.1 Finalize matches contract (Q3, Q6) | BE + FE | Phase 4 | AGREED contract |
| 5.2 Eligibility service: present players for date and sport | BE | 5.1 | `matchService.js` |
| 5.3 Create/list/get match. Reject ineligible participants (`NOT_ELIGIBLE`) and duplicates | BE | 5.2 | `app/api/matches/*` |
| 5.4 Match list, create form (only eligible players selectable), score entry | FE | 5.1 | `app/coach/matches/*` |
| 5.5 Integration | Both | 5.3, 5.4 | |

**Testing:** compulsory tests 5–7 (two present players accepted, absent player rejected). Duplicate participation rejected. Invalid score → 400.

---

## Phase 6 – Readiness and Role-Based Access ✅

**Objective:** readiness calculated from real data, plus role dashboards with strict data isolation.

**Delivered:**
- **Endpoints:** `GET /api/coach/dashboard`, `GET /api/players/:id/performance`, `GET /api/player/dashboard` (identity from the session only), `GET /api/scout/players`, `GET /api/scout/players/:id` (active and Ready only; others 404).
- **Calculation:** `backend/services/readinessService.js`, a pure `computeReadiness` rule plus two aggregations. Exactly 75% qualifies, and open sessions are ignored.
- **UI:**
  - `/coach/readiness` board: filters, attendance bars with the 75% marker, and what each player is missing.
  - Performance section on `/coach/players/:id`.
  - `/player` dashboard.
  - `/scout` Ready list and `/scout/players/:id`.
  - Coach overview "Ready players" stat.

| Task | Owner | Depends on | Output |
| --- | --- | --- | --- |
| 6.1 Finalize dashboard contracts (Q4, Q5) | BE + FE | Phase 5 | AGREED contracts |
| 6.2 Readiness service (attendance % from CLOSED sessions, matches played, `READINESS_RULES`) | BE | 6.1 | `readinessService.js` |
| 6.3 `GET /api/coach/dashboard` | BE | 6.2 | |
| 6.4 `GET /api/player/dashboard` (identity from session only) | BE | 6.2 | |
| 6.5 `GET /api/scout/players` (Ready only, filtered server-side) | BE | 6.2 | |
| 6.6 Coach, Player and Scout dashboards | FE | 6.1 | `app/coach`, `app/player`, `app/scout` |
| 6.7 Integration | Both | 6.3–6.6 | |

**Testing:** compulsory tests 8–11. Exactly 75% with 2 matches → Ready. Below 75% → not Ready. A player cannot read another player's data. A scout never receives non-Ready players.

---

## Multi-academy (added after Phase 6) ✅

**Objective:** many academies on one deployment, each with fully private data.

**Delivered:**
- An `Academy` model with per-academy coach and scout join codes, and an `academy` field on User, Player, Session and Match.
- `POST /api/auth/register-academy` (create academy + Head Coach), `POST /api/auth/register` (join with code), `GET /api/academies/lookup`, `GET/PATCH /api/academy`, `POST /api/academy/join-codes`.
- **Every service query is scoped by the signed-in user's academy.** Cross-academy ids return 404.
- **UI:** `/register` (Create / Join tabs with live code preview), `/coach/academy` (name, codes, members), academy name in the sidebar.
- `npm run migrate:academy` for existing data.

## Phase 7 – Testing, UI and Deployment

| Task | Owner | Output |
| --- | --- | --- |
| 7.1 End-to-end scenario test covering all 11 compulsory cases | BE | `tests/backend/competition.test.js` |
| 7.2 Security tests: unauthenticated, wrong role, cross-player access, closed session, duplicates, invalid data | BE | Tests |
| 7.3 Error handling and empty states on every page | FE | |
| 7.4 Responsive design pass and UI polish | FE | |
| 7.5 Remove any dev-only tools | Both | |
| 7.6 Vercel project, env vars, Atlas network access | Both (manual) | Live URL |
| 7.7 Live verification of all role flows | Both | Checklist in tracker |
| 7.8 Final GitHub verification (branches merged, no secrets) | Both (manual) | |

**Completion:** all compulsory tests pass locally and on the live URL. `main` is the deployed version.
