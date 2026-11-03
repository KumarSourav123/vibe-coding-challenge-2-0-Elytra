# Backend Guide

The backend is the Next.js Route Handlers in `app/api/` plus server-only code in `backend/` and `lib/`. There is no separate server.

## Request flow

```text
app/api/<resource>/route.js     parse input → call service → successResponse / handleRouteError
  └─ backend/services/*.js      business rules, throws AppError for expected failures
       └─ backend/models/*.js   Mongoose schemas (structure + field validation)
            └─ lib/mongodb.js   cached connection
```

Route handlers stay thin. Every route:

```js
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await someService();
    return successResponse(data, "Fetched successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
```

## MongoDB connection (`lib/mongodb.js`)

- `connectToDatabase()` caches the connection on `globalThis`, so it survives hot reload and is reused across serverless invocations. A failed connection resets the cache so the next request retries.
- Throws `DatabaseConfigError` (`code: "DB_NOT_CONFIGURED"`) if `MONGODB_URI` is missing or still the placeholder.
- `bufferCommands: false`: queries fail fast instead of hanging when disconnected.
- `serverSelectionTimeoutMS: 5000`.
- Also exports `disconnectFromDatabase()`, `getConnectionState()` and `pingDatabase()`.

## Error handling (`backend/utils/errors.js`)

| Thrown | Response |
| --- | --- |
| `new AppError(message, status, errors)` | That status, that message |
| Mongoose `ValidationError` | 400 `Validation failed`, one entry per field (`INVALID_FIELD`) |
| Mongoose `CastError` | 400 `INVALID_ID` |
| Mongo duplicate key (11000) | 409 `DUPLICATE` |
| Anything else | 500 `Internal server error`, details only outside production |

## Models (`backend/models`)

Import from `@/backend/models` so every model is registered before `populate()`.

| Model | Key fields | Built-in integrity |
| --- | --- | --- |
| `User` | name, email (unique, lowercase), passwordHash (`select: false`), role, player, isActive | `passwordHash` never serialised. Only PLAYER users can link a `player` |
| `Player` | name, age (integer 5–60), sport, createdBy, isActive | Index on sport |
| `Session` | date, sport, status (OPEN/CLOSED), attendance[{player, status, markedAt}], closedAt, createdBy | No duplicate player in attendance. Indexes on date+sport and attendance.player |
| `Match` | date, sport, opponent, participants[{player, score ≥ 0}], createdBy | No duplicate participant. Indexes on date+sport and participants.player |

Schemas enforce structure only. Business rules (closed-session immutability, attendance-based eligibility, readiness) belong in services in their phases. Every document serialises with `id` instead of `_id`, and without `__v`.

## Authentication (Phase 2)

Built from Node/Web Crypto only (no auth SDK). Contract: [API_CONTRACTS.md §1.5, §2.2–2.4](API_CONTRACTS.md).

| File | Responsibility |
| --- | --- |
| `backend/utils/password.js` | `hashPassword()` / `verifyPassword()`: scrypt (N=16384, r=8, p=1), random salt, constant-time compare |
| `lib/authToken.js` | `signSessionToken()` / `verifySessionToken()`: HS256 JWT via `crypto.subtle`. Cookie name and options. Requires `AUTH_SECRET` (≥ 32 chars) |
| `lib/roles.js` | `ROLE_HOME_PATHS`, `getHomePathForRole()`, `getRoleForPath()` |
| `backend/validators/authValidator.js` | `validateLoginInput()`: rejects non-strings (blocks `{ "$ne": null }` injection) |
| `backend/services/authService.js` | `authenticate()` (same failure path and timing for unknown email or wrong password), `getActiveUserById()`, `toSessionPayload()` |
| `backend/middleware/auth.js` | `getSessionUser()`, `requireAuth()`, `requireRole()` |
| `app/api/auth/{login,logout,me}` | Thin route handlers |
| `proxy.js` | Page redirects for `/login`, `/coach`, `/player`, `/scout` |
| `scripts/seed.mjs` | Creates demo accounts (`npm run seed`) |

**Protecting a new API route (Phase 3+):**

```js
import { requireRole } from "@/backend/middleware/auth";
import { ROLES } from "@/backend/utils/constants";

export async function POST(request) {
  try {
    const coach = await requireRole(request, ROLES.COACH); // 401 / 403 handled by handleRouteError
    // ... use coach._id, never an id from the request body, for ownership
  } catch (error) {
    return handleRouteError(error);
  }
}
```

For PLAYER endpoints, use `user.player` from `requireRole(request, ROLES.PLAYER)` as the player id. Never read it from params or the body.

Rules:

- `passwordHash` has `select: false`. Add `.select("+passwordHash")` only inside `authService`.
- The User model rejects any `passwordHash` that isn't in scrypt format. Always call `hashPassword()` first.
- The proxy only redirects pages. Every API must still call `requireAuth`/`requireRole`.
- Rotating `AUTH_SECRET` signs everyone out.

## Accounts and players (Phase 3)

| File | Responsibility |
| --- | --- |
| `backend/validators/common.js` | `createValidator()` plus `checkString/Email/NewPassword/Integer/Boolean`. Reuse these for every new validator |
| `backend/validators/playerValidator.js` | Create, update, reset-password and list-query validation |
| `backend/services/playerService.js` | `createPlayer` (profile + PLAYER login, rolled back on failure), `listPlayers`, `getPlayer`, `updatePlayer` (syncs name, email and isActive to the login), `resetPlayerPassword` |
| `backend/services/authService.js` | Also `registerUser` (access-code gated) and `changePassword` |
| `backend/utils/accessCode.js` | Constant-time access-code check; a role is disabled if its code is unset |
| `backend/utils/sport.js` | `normalizeSport()`, applied as a setter on every `sport` field |
| `app/api/players/**`, `app/api/auth/{register,change-password}` | Thin routes |

**User fields added:**
- `mustChangePassword`
- `sessionVersion`, which must equal the token's `sv` claim. Increment it to sign a user out everywhere.
- A unique index on `player`, so each profile has at most one login.

**Guards:**
- `requireAuth`/`requireRole` return **403 `PASSWORD_CHANGE_REQUIRED`** for users with a temporary password.
- Only `/me` and `/change-password` pass `{ allowPasswordChangeRequired: true }`. Don't add it to other routes.

**Phase 4+ note:** filter players by `sport` with the normalized value (models already normalize on save), and use `isActive: true` to find eligible players.

## Practice sessions (Phase 4)

| File | Responsibility |
| --- | --- |
| `backend/utils/date.js` | `parseDateOnly("YYYY-MM-DD")` → UTC-midnight `Date` (rejects 2026-02-30). `formatDateOnly(date)` |
| `backend/validators/sessionValidator.js` | Create body, list query, attendance records (shape, duplicate ids in one request). `checkDateOnly` is reusable for matches |
| `backend/services/sessionService.js` | `createSession`, `listSessions`, `getSession`, `markAttendance`, `closeSession`, `findEligiblePlayers(sport)` |
| `app/api/sessions/**` | Thin routes (COACH only) |

Rules enforced in the service:

- **Eligible** = `Player.isActive && player.sport === session.sport`. Any ineligible record rejects the whole request.
- **Attendance is an upsert:** at most one record per player.
- **Close needs every eligible player marked** (409 `ATTENDANCE_INCOMPLETE`).
- **Closed is final** (409 `SESSION_CLOSED`).
- **All writes go through `updateOpenSession()`:** a `findOneAndUpdate` filtered on `{ status: "OPEN", __v }` with `$inc: { __v: 1 }`. If the filter misses, the service reports `SESSION_CLOSED` or `CONFLICT`. **Never `save()` a session directly.**

**Phase 5 hooks:**
- To check same-day eligibility, query `Session.find({ date, sport, "attendance": { $elemMatch: { player, status: "PRESENT" } } })`.
- Reuse `checkDateOnly` and `findEligiblePlayers`.

**Phase 6:** attendance % uses only `status: "CLOSED"` sessions.

## Matches (Phase 5)

| File | Responsibility |
| --- | --- |
| `backend/validators/matchValidator.js` | Create and update bodies (participants: 1–100, unique ids, score 0–100000), eligible and list queries |
| `backend/services/matchService.js` | `getEligiblePlayers`, `createMatch`, `listMatches`, `getMatch`, `updateMatch` |
| `app/api/matches/**` | Thin routes (COACH only). `eligible-players` is a static segment, so it wins over `[id]` |

**Eligibility:** `getAttendanceForDay(date, sport)` reads every session for the day.
- Only `CLOSED` sessions contribute.
- A player counts as present if any closed session has them PRESENT.
- `assertParticipantsEligible` additionally requires `isActive` and the same sport, and reports the exact reason per player.

`date` and `sport` can't be changed by PATCH. Updates compare-and-set on `__v` (409 `CONFLICT`).

**Phase 6:** matches played for a player = `Match.countDocuments({ "participants.player": playerId })`. Per-match scores are in `participants.score`.

## Readiness (Phase 6)

| File | Responsibility |
| --- | --- |
| `backend/services/readinessService.js` | `computeReadiness` / `computePerformance` (pure), `aggregateStats` (CLOSED sessions + matches, two aggregations), `getCoachDashboard`, `listReadyPlayers`, `getPlayerPerformance`, `getOwnDashboard`, `getReadyPlayerForScout` |
| `backend/validators/readinessValidator.js` | Coach dashboard and scout list queries |
| `app/api/coach/dashboard`, `app/api/players/[id]/performance`, `app/api/player/dashboard`, `app/api/scout/players/**` | Thin routes with role guards |

Rules:

- **Never store readiness.** Always call the service.
- **The threshold is integer math:** `attended × 100 ≥ 75 × completed`. `attendancePercent` is display-only.
- **Player isolation:** `/api/player/dashboard` reads `user.player` from `requireRole(request, ROLES.PLAYER)`. Query params are ignored.
- **Scout isolation:** only `isActive && isReady`. A non-Ready id returns the same 404 as an unknown id. Responses never include account data.

## Multi-academy

| File | Responsibility |
| --- | --- |
| `backend/models/Academy.js` | Name plus unique `coachJoinCode` / `scoutJoinCode` (hidden from `toJSON`) |
| `backend/utils/schemaHelpers.js` | `academyField`: required, indexed ref used by User, Player, Session and Match |
| `backend/utils/joinCode.js` | `generateJoinCode()` (`XXXX-XXXX-XXXX`, 60 bits), `normalizeJoinCode()` |
| `backend/services/academyService.js` | `createAcademy`, `resolveJoinCode`, `lookupJoinCode`, `getAcademyOverview`, `renameAcademy`, `regenerateJoinCode` |
| `backend/services/authService.js` | `registerAcademy` (academy + Head Coach, rolled back on failure), `registerUser` (join by code) |
| `backend/middleware/auth.js` | `requireAuth` blocks accounts without an academy (403 `ACADEMY_REQUIRED`). `requireHeadCoach` |
| `scripts/migrate-academy.mjs` | `npm run migrate:academy`: moves records without an academy into "Sports Academy" (idempotent) |

**The one rule:** every service function takes the academy from the session user (`user.academy`) and **every query includes `academy`**. Lookups by id use `findOne({ _id, academy })`, so another academy's id behaves exactly like an unknown id. Never accept an academy id from the request.

## Testing

- `npm test` runs Vitest. `tests/backend/mongodb.integration.test.js` starts a real in-memory MongoDB (`mongodb-memory-server`), so tests never touch Atlas.
- Write a service test against the in-memory DB for every new business rule, and a route test for its status codes.
- Use the helpers in `tests/helpers/`:
  - `startTestDatabase` / `stopTestDatabase`, `createUser` (pass `academy`) and `loginAs` (`db.js`). Create the academy with `createAcademy()` from `academyService`
  - `makeRequest` / `sessionCookieFrom` (`requests.js`)
- Dynamic routes take a second argument: `GET(request, { params: Promise.resolve({ id }) })`.

## Verifying Atlas connectivity

1. Create `.env.local` with `MONGODB_URI=mongodb+srv://…`.
2. Run `npm run dev` and open `http://localhost:3000/api/health`.
3. Expect `200` with `"database": { "status": "connected" }`. If you get 503 `DB_CONNECTION_FAILED`, check Atlas Network Access (IP allow-list) and the database user's credentials.
