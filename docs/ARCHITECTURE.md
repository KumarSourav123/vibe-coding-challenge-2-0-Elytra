# How AthleteIQ Is Built

A plain-language tour of the code. For exact API details see [API_CONTRACTS.md](API_CONTRACTS.md).

---

## 1. One app, three layers

AthleteIQ is a single **Next.js** app. Pages and the API are deployed together, so there's no separate backend server.

```text
 Browser ──► app/ (pages)      ──► frontend/ (screens, UI pieces) ──┐
                                                                    │  fetch /api/...
 Browser ──► app/api/ (routes) ──► backend/middleware (who are you?) ◄┘
                                   └► backend/validators (is the input OK?)
                                   └► backend/services   (the rules)
                                       └► backend/models (MongoDB via Mongoose)
```

Every API route is short and follows the same four steps:

```js
export async function POST(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH);            // 1. who is calling?
    const input = validateCreateSessionInput(await readJsonBody(request)); // 2. is the input valid?
    const session = await createSession(input, coach);                // 3. apply the rules
    return successResponse({ session }, "Session created", 201);      // 4. standard reply
  } catch (error) {
    return handleRouteError(error);                                   //    standard error
  }
}
```

---

## 2. Folders

| Folder | What's inside |
| --- | --- |
| `app/` | Pages, grouped by layout: `(site)` public, `(auth)` sign-in and sign-up, `(app)` signed-in area. `app/api/` holds the API routes |
| `frontend/components/` | Reusable UI (`ui/`: Button, Card, Table, Input…) and page layout (`layout/`: sidebar, header) |
| `frontend/features/<feature>/` | Each feature in one place: `api/` (calls to the server), `components/`, `utils/`, `mocks/` (test data) |
| `frontend/hooks/`, `frontend/utils/` | Shared helpers: data loading, clipboard, dates, sports |
| `backend/models/` | Database shapes: Academy, User, Player, Session, Match |
| `backend/services/` | Business rules, one file per feature |
| `backend/validators/` | Input checks, one file per feature |
| `backend/middleware/` | `requireAuth`, `requireRole`, `requireHeadCoach` |
| `backend/utils/` | Shared helpers: standard responses, errors, academy scoping, passwords, dates |
| `lib/` | Basics used everywhere: database connection, login tokens, role home pages |
| `proxy.js` | Sends people to the right pages (e.g. guests to Sign in) |
| `scripts/` | `seed` (demo data) and `migrate:academy` (one-time upgrade) |
| `tests/` | Automated tests (`backend/`, `frontend/`, `helpers/`) |

**Features** (the same names are used in `frontend/features/`, `backend/services/` and `app/api/`): auth, academy, players, sessions, matches, readiness, evaluation, health, onboarding (the guided tour).

---

## 3. Data

```text
Academy ─┬─ User      (Head Coach, Coach, Scout, Player logins)
         ├─ Player    (name, age, sport, active?)  ◄── a PLAYER User links to one Player
         ├─ Session   (date, sport, OPEN/CLOSED, attendance: [player, PRESENT/ABSENT])
         └─ Match     (date, sport, opponent, participants: [player, score])
```

- Every record belongs to **one academy**.
- Readiness is **never stored**. It's calculated from closed sessions and matches each time it's shown.

---

## 4. The main rules (enforced on the server)

| Rule | Where |
| --- | --- |
| Only coaches manage players, sessions and matches | `requireRole` in each route |
| Everyone sees only their own academy | every query filters by `user.academy` (`backend/utils/academyScope.js`) |
| A player sees only their own records | the player is taken from the login, never from the request |
| Scouts see only Ready players | `readinessService.listReadyPlayers` |
| Attendance only for active players of the session's sport | `sessionService.markAttendance` |
| A session closes only when everyone is marked, and is then locked | `sessionService.closeSession` |
| Match players must be Present at a closed session that day | `matchService` |
| Ready = attendance ≥ 75% and ≥ 2 matches | `readinessService.computeReadiness` |

---

## 5. Security in short

- **Passwords** are stored only as scrypt hashes, and the database refuses plain text.
- **Logins** are signed tokens in an HttpOnly cookie, which browser scripts can't read. Changing a password signs out all other devices.
- **Every API** re-checks the user in the database. The browser is never trusted for who you are or which academy you belong to.
- **Another academy's record** looks exactly like a record that doesn't exist (404).
- **Secrets** (`MONGODB_URI`, `AUTH_SECRET`) never leave the server.

---

## 6. Quality

- `npm run check` runs code style checks, all automated tests and a production build.
- Tests run against a **real temporary MongoDB**, covering all 11 competition test cases, every permission rule, and academy isolation.
- Responses always have the same shape: `{ success, message, data }` or `{ success, message, errors }`.
