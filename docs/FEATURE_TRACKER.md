# Feature Tracker

Statuses: `PENDING` · `IN PROGRESS` · `TESTING` · `READY FOR INTEGRATION` · `INTEGRATED` · `COMPLETE`

Update this file whenever a status changes. Last updated: 2026-11-02.

| # | Feature | Phase | API contract | Backend | Frontend | Independent testing | Integration | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Project setup & folder architecture | 1 | N/A | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 2 | MongoDB connection utility | 1 | N/A | COMPLETE | N/A | COMPLETE | INTEGRATED | COMPLETE |
| 3 | Initial models (User, Player, Session, Match) | 1 | N/A | COMPLETE | N/A | COMPLETE | N/A | COMPLETE |
| 4 | Health check `GET /api/health` | 1 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 5 | Landing page, role cards, reusable UI | 1 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 6 | Authentication & roles | 2 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7 | Player management (create with login, list, view, edit, reset password) | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7a | Coach/Scout registration with access codes | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 7b | First-login password change + change password | 3 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 8 | Practice sessions & attendance | 4 | IMPLEMENTED | COMPLETE | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 8a | UI redesign (app shell, design system) | 3→4 | N/A | N/A | COMPLETE | COMPLETE | INTEGRATED | COMPLETE |
| 9 | Matches & scoring | 5 | DRAFT | PENDING | PENDING | PENDING | PENDING | PENDING |
| 10 | Readiness calculation | 6 | DRAFT | PENDING | N/A | PENDING | PENDING | PENDING |
| 11 | Coach dashboard | 6 | DRAFT | PENDING | PENDING | PENDING | PENDING | PENDING |
| 12 | Player dashboard (own data only) | 6 | DRAFT | PENDING | PENDING | PENDING | PENDING | PENDING |
| 13 | Scout dashboard (Ready only) | 6 | DRAFT | PENDING | PENDING | PENDING | PENDING | PENDING |
| 14 | Compulsory competition test cases | 7 | N/A | PENDING | PENDING | PENDING | PENDING | PENDING |
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

## Surprise requirement (4 Nov, 11:00 IST)

Record it here, then update the roadmap and affected contracts.
