# Frontend Guide

Pages live in `app/`. Everything reusable lives in `frontend/`. Styling uses Tailwind CSS v4: theme tokens (`brand-*` colors, `shadow-card`, `shadow-raised`, Inter font) are declared in `app/globals.css` under `@theme`.

## Design system

Minimal and premium. Follow these rules so every screen stays consistent:

- **Colour:**
  - Neutrals are `slate`.
  - **Primary actions are ink** (`slate-900`).
  - Green (`brand`/`emerald`) is only for status and small accents.
  - Amber is for warnings and rose for errors.
- **Type:**
  - Inter, self-hosted via `next/font`.
  - Page titles: `text-2xl font-semibold tracking-tight`. Card titles: `text-sm font-semibold`. Secondary text: `text-sm text-slate-500`.
- **Surfaces:**
  - `Card` (`rounded-xl`, `border-slate-200/80`, `shadow-card`).
  - Use `padding={false}` for tables and lists, and a `title`/`action` header for sections.
- **Spacing:**
  - Every app page starts with `PageHeader`.
  - Page sections are separated by `space-y-6` / `space-y-8`.
- **Forms:**
  - Use `FormSection` (label column + fields) and `FormActions` (right-aligned footer) inside `<Card padding={false}>`.
  - Fields are 40px tall (`h-10`).
- **Icons:** add paths to `components/ui/Icon.js`. Don't add an icon library.

## Layouts (route groups; URLs are unchanged)

| Group | Layout | Pages |
| --- | --- | --- |
| `app/(site)` | `SiteHeader` + `SiteFooter` | `/` |
| `app/(auth)` | Logo + centered `AuthCard` | `/login`, `/register` |
| `app/(app)` | `AppShell`: sidebar nav by role (`components/layout/navigation.js`), user card with log out, mobile slide-over | `/coach/**`, `/player`, `/scout`, `/account/**` |

To add a page for a role, put it under `app/(app)/<role>/…` and add a nav item in `navigation.js`. Remove `soon: true` when the phase ships.

## Structure

```text
frontend/
  components/ui/       Button, Card, Badge, Input, Select, Switch, Alert, Avatar, Icon, Logo,
                       StatCard, EmptyState, ErrorState, FormSection, Spinner/LoadingBlock, Container
  components/layout/   AppShell, navigation, PageHeader, SectionHeading, SiteHeader, SiteFooter
  hooks/               useApiQuery, useDebouncedValue
  features/<feature>/
    api/               Fetch functions for that feature's endpoints (normalise responses)
    components/        Feature UI
    hooks/             Client state hooks
    mocks/             Contract-exact mock responses (tests and UI dev only)
    data/              Static UI copy (not API data)
  utils/               cn(), config (public env only)
```

## Rules

1. Read `docs/API_CONTRACTS.md` before building a feature. Mocks must match it field for field.
2. Components never call `fetch` directly. They use the feature's `api/` function, which handles the `{ success, message, data | errors }` envelope.
3. Production code never imports from `mocks/`.
4. Never import `backend/` or `lib/` into the frontend. Only `NEXT_PUBLIC_*` env vars are allowed.
5. Every data view handles **loading**, **empty**, **error** and **success** states.
6. Mark components `"use client"` only when they need state, effects or event handlers. Keep pages as server components where possible.

## UI components

| Component | Props |
| --- | --- |
| `Button` | `variant` (`primary` · `secondary` · `ghost` · `danger`), `size` (`sm` · `md` · `lg`), `href` (renders a Link), `icon` / `iconRight` (Icon names) |
| `Card` | `title`, `description`, `action` (header row), `padding` (default true), `as`, `className` |
| `Badge` | `tone` (`neutral` · `success` · `danger` · `warning` · `info`), `dot` |
| `Input` / `Select` | `label`, `hint`, `error`, `icon` (Input only); same 40px height |
| `Switch` | `checked`, `onChange(bool)`, `label`, `description` |
| `Avatar` | `name` (initials + stable colour), `size` (`sm` · `md` · `lg`) |
| `StatCard` | `label`, `value` (`null` = loading), `hint`, `icon` |
| `EmptyState` | `icon`, `title`, `description`, `action` |
| `PageHeader` | `title`, `description`, `actions`, `backHref`/`backLabel`, `meta` |
| `Spinner` / `LoadingBlock` | `label` (screen-reader text) |
| `Container` | max-width wrapper for public pages (the app shell has its own) |

## Auth feature (Phase 2)

- `features/auth/context/AuthProvider.js`: wraps the app in `app/layout.js`. `useAuth()` returns `{ status, user, homePath, message, refresh, signIn, signOut }`, where `status` is `loading | authenticated | unauthenticated | error`.
- `features/auth/api/authApi.js`: `login()`, `logout()`, `fetchCurrentUser()`. The session token is an HttpOnly cookie, so the frontend never stores or reads a token (no localStorage).
- `components/LoginForm.js`: client checks for empty fields, server field errors, a form-level alert for credential, disabled and network errors, and a show/hide password toggle. After login it goes to `homePath`, or to `?next=` only if that stays inside the user's own area.
- `components/UserMenu.js`: header controls (Sign in, or name, role, Dashboard and Log out).
- `components/RoleHome.js`: `/coach`, `/player` and `/scout` home pages with loading, error and expired-session states. Replace these with real dashboards in Phase 6.
- New UI components: `Input` (label, error, hint, aria wiring) and `Alert` (`danger` · `warning` · `info` · `success`).
- Mocks: `features/auth/mocks/authMock.js`.

Use `useAuth()` for display only (names, menus). Access control is enforced by the API and `proxy.js`, never by hiding UI.

## Shared data helpers (Phase 3)

- `frontend/utils/apiClient.js`: `apiRequest(path, { method, body, query })` never throws and returns `{ ok, status, data, message }` or `{ ok: false, code, message, fieldErrors }`. **Use it for every new API function.**
- `frontend/hooks/useApiQuery.js`: `useApiQuery(key, fetcher)` → `{ loading, result, reload, setResult }`. It refetches when `key` changes, keeps the previous result while loading, and ignores stale responses.
- `frontend/hooks/useDebouncedValue.js`: debounces search inputs.
- New UI components:
  - `Select`
  - `ErrorState`, which shows the right action for `UNAUTHENTICATED` (sign in) and `PASSWORD_CHANGE_REQUIRED` (change password), otherwise a retry button.

## Players feature (Phase 3)

| Route | Component | What it does |
| --- | --- | --- |
| `/coach/players` | `PlayerList` | Search (name or email, debounced), sport and status filters, table with status badges, empty and loading states |
| `/coach/players/new` | `CreatePlayer` → `PlayerForm mode="create"` | Profile, login email and temporary password (with a generator). On success, `CredentialsCard` shows the login details once, with a copy button |
| `/coach/players/:id` | `PlayerDetails` | Profile and login summary, inline edit (`PlayerForm mode="edit"` sends only changed fields), `ResetPasswordPanel` |
| `/register` | `RegisterForm` | Coach/Scout sign-up with an access code |
| `/account/password` | `ChangePasswordForm` | Required first-login change, also linked from the header menu |

Mocks: `features/players/mocks/playersMock.js`. The sport field suggests `COMMON_SPORTS`, but any name is accepted (the server normalizes it).

## Sessions feature (Phase 4)

| Route | Component | What it does |
| --- | --- | --- |
| `/coach/sessions` | `SessionList` | `SegmentedControl` status tabs (All/Open/Closed), sport filter, table with progress bar ("2 of 3 marked") |
| `/coach/sessions/new` | `CreateSessionForm` | Date (defaults to today, local) and sport, with a live "N active players play X" preview |
| `/coach/sessions/:id` | `SessionDetails` | Stat cards. OPEN: `AttendanceEditor` + `CloseSessionPanel`. CLOSED: locked roster |

- **`AttendanceEditor`:**
  - Present/Absent toggles per player, "All present" and "Undo changes".
  - Highlights unsaved rows and sends only the changed rows.
  - It's re-mounted with `key={session.updatedAt}` after each save, so the draft resets from the server.
- **`CloseSessionPanel`:** disabled while there are unsaved changes or unmarked players, and asks for confirmation (closing is irreversible).
- **Helpers:**
  - `frontend/utils/date.js`: `formatDayLabel` (UTC-safe), `todayDateOnly`, `formatTimestamp`.
  - `frontend/utils/sport.js`: preview-only copy of the server's sport normalization.
  - `features/sessions/utils/attendanceLabel.js`.
- **Testing:** keep pure helpers out of `.js` files that contain JSX. Vitest can't import JSX from `.js` files.

## Matches feature (Phase 5)

| Route | Component | What it does |
| --- | --- | --- |
| `/coach/matches` | `MatchList` | Sport filter. Table: opponent and date, sport, player count, top scorer |
| `/coach/matches/new` | `CreateMatchForm` | Date, sport and opponent, then `ParticipantPicker`. Changing the date or sport clears the selection |
| `/coach/matches/:id` | `MatchDetails` | Stat cards (players, total, top, average), ranked scoreboard, `EditMatchForm` (opponent and participants; date and sport fixed) |

- **`ParticipantPicker`:**
  - Calls `GET /api/matches/eligible-players` for the chosen date and sport.
  - Shows a checkbox and score input per eligible player, with select all.
  - Explains empty states: "Close the session first" (open session), "No session on this date", or "Nobody present".
  - In edit mode, `existing` players who are no longer eligible are shown so the coach can remove them.
- **`utils/participants.js`:** `buildParticipants` (client score check), `participantErrorsFrom` (maps `participants.<i>.*` server errors to player ids), `selectionFromMatch`.

## Readiness feature (Phase 6)

| Route | Component | What it does |
| --- | --- | --- |
| `/coach/readiness` | `CoachReadinessBoard` | Summary cards. Ready / Not ready tabs, sport filter, name search. Table with attendance bar (75% marker), matches out of 2, badge and what's missing |
| `/coach/players/:id` | `PlayerPerformanceSection` | Performance and readiness under the profile |
| `/player` | `PlayerDashboard` | The signed-in player's own records (no id is ever sent) |
| `/scout` | `ScoutPlayerList` | Ready players: attendance, matches, average and best score |
| `/scout/players/:id` | `ScoutPlayerDetail` | One Ready player. Others show "Player not available" |

- `PerformanceDetail` (shared): stat cards, `ReadinessCard` (verdict, reasons and meters), match history and attendance history.
- `ReadinessMeter`: a bar with a threshold marker, and a `compact` variant for tables.
- `utils/readinessText.js`: `readinessGaps` (uses the same exact rule as the server), `readinessSummary`, `formatScore`.

## Health feature (reference implementation)

`features/health` is the pattern to copy for later features:

- `api/healthApi.js`: `fetchHealth()` calls `GET /api/health` with `cache: "no-store"`. `parseHealthResponse()` maps 200, 503, network errors and bad JSON to `{ status, message, latencyMs, errorCode, checkedAt }`.
- `hooks/useHealthStatus.js`: `state` is `loading | connected | disconnected`, plus `refresh()` (aborts in-flight requests).
- `components/HealthStatus.js`: status dot, badge, explanation, a hint per error code, and a Recheck button.
- `mocks/healthMock.js`: contract mocks used by `tests/frontend/healthApi.test.js`.
