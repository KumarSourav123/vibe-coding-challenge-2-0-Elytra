# Frontend Guide

Pages live in `app/`. Everything reusable lives in `frontend/`. Styling uses Tailwind CSS v4, with theme colours, shadows and the Inter font defined in `app/globals.css`.

---

## Layouts (URLs don't include the group name)

| Group | Layout | Pages |
| --- | --- | --- |
| `app/(site)` | Header + footer | `/` (home) |
| `app/(auth)` | Logo + centered card | `/login`, `/register` |
| `app/(app)` | Sidebar (`AppShell`) with role-based menu | `/coach/**`, `/player`, `/scout/**`, `/account/password` |

To add a page for a role, put it under `app/(app)/<role>/…` and add a menu item in `frontend/components/layout/navigation.js`.

---

## Folders

```text
frontend/
  components/ui/       Building blocks (no feature logic)
  components/layout/   AppShell, navigation, PageHeader, SiteHeader, SiteFooter, SectionHeading
  features/<feature>/  api/ (server calls) · components/ · utils/ · data/ · mocks/ (test data only)
  hooks/               useApiQuery, useCopyToClipboard, useDebouncedValue
  utils/               apiClient, sport, date, config, cn
```

**Features:** auth, academy, players, sessions, matches, readiness, coach (overview stats), evaluation (judging box), health, landing, onboarding (guided tour).

---

## Building blocks (`components/ui/`)

| Component | Use it for |
| --- | --- |
| `Button` | Every button or button-style link (`variant`: primary, secondary, ghost, danger; `icon`) |
| `Card` | Any panel. Use `title`, `description` and `action` for a header, and `padding={false}` for tables |
| `Table` | `TH_CLASS` for header cells, `TableFooter` for the count and refresh spinner under a list |
| `Input`, `Select`, `Switch`, `SegmentedControl`, `FormSection` | Forms, all the same height and style |
| `Badge`, `Avatar`, `StatCard`, `Icon`, `Logo` | Labels, initials, numbers, icons, brand |
| `Alert`, `EmptyState`, `ErrorState`, `NotFoundCard`, `Spinner` / `LoadingBlock` | Messages, plus the empty, error, not-found and loading states |
| `PageHeader` (layout) | The title row at the top of every signed-in page |

---

## Rules to keep

1. **Talk to the server only through a feature's `api/` file.** Those files use `apiRequest()`, which never throws and always returns `{ ok, data }` or `{ ok: false, code, message, fieldErrors }`.
2. **Load data with `useApiQuery(key, fetcher)`.** It refetches when `key` changes and ignores stale answers.
3. **Every screen handles loading, empty, error and not-found.** Use `isNotFoundResult(result)` together with `NotFoundCard`.
4. **Use the shared helpers instead of re-writing them:**
   - `buildSportFilterOptions()` and `COMMON_SPORTS` (`utils/sport.js`)
   - `useCopyToClipboard()`
   - `formatDayLabel()` (`utils/date.js`)
5. **Never import `backend/` or `lib/`** into frontend code. Only `NEXT_PUBLIC_*` settings are visible in the browser.
6. **Keep pure helpers in files without JSX**, so tests can import them.
7. **The UI only explains rules.** The server enforces them (e.g. the Ready rule, closed sessions).

---

## Screens by feature

| Feature | Screens |
| --- | --- |
| auth | Sign in, Create / Join academy, Change password |
| academy | Academy page: members, rename and join codes (Head Coach) |
| players | List (search and filters), Add (shows login details once), Details (edit, deactivate, reset password, performance) |
| sessions | List (Open / Closed tabs), New, Details (Present / Absent toggles, close with confirmation) |
| matches | List, New (only eligible players offered), Details (scoreboard, edit) |
| readiness | Coach readiness board, player dashboard, scout Ready list and detail |
| onboarding | Guided tour for each page. Its on/off state is kept in the browser (`localStorage`) |
| evaluation | Yellow judging box on Sign in and Join (only when evaluation mode is on) |
