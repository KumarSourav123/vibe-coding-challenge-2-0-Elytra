# API Contracts

Single source of truth for every API endpoint. **Frontend and backend implement exactly what is written here.** Any change is made here first and communicated to the other developer.

Contract status values: `DRAFT` (proposed, may change) → `AGREED` (both developers signed off, implementation may start) → `IMPLEMENTED` (built and tested).

---

## 1. Conventions

### 1.1 Response envelope

Success:

```json
{ "success": true, "message": "Operation completed successfully", "data": {} }
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "age", "code": "INVALID_FIELD", "message": "Age must be at least 5" }]
}
```

- `errors[]` items always have `message`. `field` is present for field-level problems, and `code` is a machine-readable string.
- Implemented by `backend/utils/apiResponse.js` (`successResponse`, `errorResponse`) and `backend/utils/errors.js` (`AppError`, `handleRouteError`).
- In production, 500 responses never include internal error details.

### 1.2 HTTP status codes

| Status | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Validation failed / malformed ID |
| 401 | Not authenticated |
| 403 | Authenticated but role or ownership not allowed |
| 404 | Resource not found |
| 409 | Conflict: duplicate record, or modifying a closed session |
| 503 | Service unavailable (database not reachable) |
| 500 | Unexpected server error |

### 1.3 Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `INVALID_FIELD` | 400 | A field failed validation (`field` is set) |
| `INVALID_ID` | 400 | Malformed ObjectId |
| `INVALID_JSON` | 400 | Body is not a JSON object |
| `INVALID_CREDENTIALS` | 401 | Email or password is wrong (always the same message, no hint about which) |
| `UNAUTHENTICATED` | 401 | No valid session cookie |
| `ACCOUNT_DISABLED` | 403 | Correct credentials, but `isActive` is false |
| `PASSWORD_CHANGE_REQUIRED` | 403 | User has a temporary password and must change it first |
| `REGISTRATION_DISABLED` | 403 | No access code is configured for that role |
| `INVALID_ACCESS_CODE` | 403 | Wrong registration access code |
| `INVALID_CURRENT_PASSWORD` | 400 | `currentPassword` is wrong (`field: "currentPassword"`) |
| `NO_LOGIN_ACCOUNT` | 409 | Player profile has no linked login account |
| `NO_PLAYER_PROFILE` | 404 | Signed-in PLAYER account is not linked to a player profile |
| `FORBIDDEN` | 403 | Authenticated, but the role or ownership is not allowed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE` | 409 | Unique constraint violated |
| `SESSION_CLOSED` | 409 | Practice session is closed and can't be modified (Phase 4) |
| `NOT_ELIGIBLE` | 400 | Player not eligible for the session or match (`field` = `records.<i>.playerId`; Phase 4/5) |
| `ATTENDANCE_INCOMPLETE` | 409 | Session can't be closed until every eligible player is marked (Phase 4) |
| `CONFLICT` | 409 | The record changed during the request (concurrent edit). Reload and retry |
| `DB_NOT_CONFIGURED` | 503 | `MONGODB_URI` missing |
| `DB_CONNECTION_FAILED` | 503 | Database unreachable |
| `AUTH_NOT_CONFIGURED` | 500 | `AUTH_SECRET` missing or shorter than 32 characters |
| `INTERNAL_ERROR` | 500 | Unexpected error (details hidden in production) |

Add new codes here before using them.

### 1.4 Data conventions

- **IDs:** documents are returned with `id` (string). `_id` and `__v` are never returned.
- **Dates:** calendar-day fields (`date` on sessions and matches) are sent and received as `"YYYY-MM-DD"` and stored as UTC midnight. Timestamps (`createdAt`, `updatedAt`, `closedAt`) are ISO 8601 strings.
- **Enums:** roles `COACH | PLAYER | SCOUT`, session status `OPEN | CLOSED`, attendance `PRESENT | ABSENT`. Source: `backend/utils/constants.js`.
- **Sport:** free text, normalized on save: whitespace collapsed, each word Title Case (`" table  TENNIS "` → `"Table Tennis"`). Matching and filtering are therefore exact on the normalized value. Applies to players, sessions and matches (resolves Q2).
- **Passwords:** 8–128 characters for every new or changed password.
- **Passwords:** never returned. `passwordHash` is excluded from all responses.

### 1.5 Authentication (Phase 2 – `IMPLEMENTED`)

Built without any auth SDK, using only Node/Web Crypto:

- **Passwords:** hashed with scrypt (`node:crypto`, random 16-byte salt). Stored as `scrypt$N$r$p$salt$hash` in `User.passwordHash`. The model rejects anything that isn't in this format, so a plain-text password can never be saved.
- **Session:** an HMAC-SHA256 signed token (JWT format, `alg: HS256`) carrying `{ sub: userId, role, sv, pwc, iat, exp }`, signed with `AUTH_SECRET` and valid for 7 days.
  - `sv` (session version) must equal `User.sessionVersion`. Changing or resetting a password increments it, which **ends every older session** (Phase 3).
  - `pwc` is `true` while the user must change a temporary password. It's only used by `proxy.js` for redirects.
- **Transport:** cookie `sa_session`, with `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`, and `Secure` in production. The token is never placed in a response body, so the browser can't read it.
- **Protected APIs:** call `requireAuth(request)` or `requireRole(request, ...roles)`. Both verify the token **and reload the user from the database**, so deactivation or role changes take effect immediately. The user's role and `playerId` always come from the database, never from the request.
- **Protected pages:** `proxy.js` redirects `/coach`, `/player` and `/scout` (and sub-paths) to `/login` without a valid session, or to the user's own home if the role doesn't match. This only guides navigation; real enforcement is in each API.
- **CSRF:** `SameSite=Lax` blocks the cookie on cross-site POSTs, and mutating endpoints accept only JSON bodies.
- **Role home paths:** `COACH → /coach`, `PLAYER → /player`, `SCOUT → /scout`.
- **Temporary passwords (Phase 3):** accounts created or reset by a Coach have `mustChangePassword: true`.
  - Until the password is changed, every protected API returns **403 `PASSWORD_CHANGE_REQUIRED`**, except `GET /api/auth/me`, `POST /api/auth/change-password` and `POST /api/auth/logout`.
  - `proxy.js` sends those users to `/account/password`.

**Session user object** (returned by login, register, change-password and me):

```json
{
  "id": "6650…", "name": "Coach Demo", "email": "coach@academy.test",
  "role": "COACH", "playerId": null, "mustChangePassword": false
}
```

`playerId` is the linked `Player` id for PLAYER users, otherwise `null`. `passwordHash` is never returned.

### 1.6 Account creation (Phase 3 – `IMPLEMENTED`)

| Role | How an account is created |
| --- | --- |
| PLAYER | Only by a Coach, via `POST /api/players` (profile + login in one step, temporary password). There is **no** player self-registration. |
| COACH | Self-registration via `POST /api/auth/register` with the access code in `COACH_SIGNUP_CODE` |
| SCOUT | Self-registration via `POST /api/auth/register` with the access code in `SCOUT_SIGNUP_CODE` |
| Any | `npm run seed` demo accounts (development) |

If a role's access code env var is unset or shorter than 8 characters, registration for that role is disabled.

**One shared academy:** every Coach can see and manage every player, regardless of which Coach created them.

---

## 2. Endpoints

### 2.1 `GET /api/health` – `IMPLEMENTED` (Phase 1)

| Item | Value |
| --- | --- |
| Purpose | Report application and MongoDB connection health |
| Request params / body | None |
| Authentication | None (public) |
| Required role | None |
| Validation | N/A |
| Caching | Never cached (`dynamic = "force-dynamic"`, client uses `cache: "no-store"`) |
| Backend owner | Backend developer (`app/api/health/route.js`, `backend/services/healthService.js`) |
| Frontend consumer | `frontend/features/health/api/healthApi.js` → `HealthStatus` component on `/` |

**200 – healthy**

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "app": { "status": "ok", "timestamp": "2026-11-02T10:00:00.000Z" },
    "database": { "status": "connected", "latencyMs": 12 }
  }
}
```

**503 – database unavailable**

```json
{
  "success": false,
  "message": "Service unavailable: database is not connected",
  "errors": [{ "code": "DB_NOT_CONFIGURED", "message": "Database is not configured" }]
}
```

`errors[0].code` is `DB_NOT_CONFIGURED` (`MONGODB_URI` missing or still the placeholder) or `DB_CONNECTION_FAILED` (`"Unable to connect to the database"`). The connection string and host are never included.

**500** – standard error envelope (`INTERNAL_ERROR`).

**Test scenarios** (automated in `tests/backend/health.route.test.js` and `tests/backend/mongodb.integration.test.js`):

1. No `MONGODB_URI` → 503 `DB_NOT_CONFIGURED`.
2. Placeholder URI from `.env.example` → 503 `DB_NOT_CONFIGURED`.
3. Unreachable server → 503 `DB_CONNECTION_FAILED`, and the body does not contain the host.
4. Reachable database → 200, `database.status = "connected"`, numeric `latencyMs`.
5. Repeated calls reuse the cached connection.

Frontend mocks: `frontend/features/health/mocks/healthMock.js`.

---

### 2.2 `POST /api/auth/login` – `IMPLEMENTED` (Phase 2)

| Item | Value |
| --- | --- |
| Purpose | Verify credentials and start a session (sets the `sa_session` cookie) |
| Request params | None |
| Request body | `{ "email": "coach@academy.test", "password": "secret123" }` (JSON) |
| Authentication | None (public) |
| Required role | None |
| Validation | `email`: required string, valid format, ≤ 254 chars, trimmed and lower-cased. `password`: required non-empty string, ≤ 128 chars |
| Backend owner | Backend (`app/api/auth/login/route.js`, `backend/services/authService.js`, `backend/validators/authValidator.js`) |
| Frontend consumer | `frontend/features/auth/api/authApi.js` `login()` → `LoginForm` on `/login` |

**200** (+ `Set-Cookie: sa_session=…; HttpOnly; SameSite=Lax`)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "…", "name": "Coach Demo", "email": "coach@academy.test", "role": "COACH", "playerId": null },
    "homePath": "/coach"
  }
}
```

**Errors**

| Status | Code | Message |
| --- | --- | --- |
| 400 | `INVALID_JSON` | `Request body must be a JSON object` |
| 400 | `INVALID_FIELD` | `Validation failed` (one entry per field: `email` and/or `password`) |
| 401 | `INVALID_CREDENTIALS` | `Invalid email or password`. Same message and similar timing for an unknown email or a wrong password |
| 403 | `ACCOUNT_DISABLED` | `This account has been disabled` (only after a correct password) |
| 503 | `DB_NOT_CONFIGURED` / `DB_CONNECTION_FAILED` | `Service unavailable` |
| 500 | `AUTH_NOT_CONFIGURED` | `Authentication is not configured` |

**Test scenarios:** valid login for each role sets an HttpOnly cookie and returns the right `homePath`. Wrong password and unknown email give an identical 401. Missing or invalid fields → 400. Non-JSON body → 400. Disabled account → 403. Email is case-insensitive. Neither the response body nor the cookie contains `passwordHash`.

---

### 2.3 `POST /api/auth/logout` – `IMPLEMENTED` (Phase 2)

| Item | Value |
| --- | --- |
| Purpose | End the session by clearing the `sa_session` cookie |
| Request params / body | None |
| Authentication | Not required (idempotent: always succeeds) |
| Required role | None |
| Backend owner | Backend (`app/api/auth/logout/route.js`) |
| Frontend consumer | `authApi.logout()` → `UserMenu` logout button |

**200** (+ `Set-Cookie: sa_session=; Max-Age=0`)

```json
{ "success": true, "message": "Logged out", "data": {} }
```

**Test scenarios:** the response clears the cookie. Logging out without a session still returns 200.

---

### 2.4 `GET /api/auth/me` – `IMPLEMENTED` (Phase 2)

| Item | Value |
| --- | --- |
| Purpose | Return the currently authenticated user |
| Request params / body | None (reads the `sa_session` cookie) |
| Authentication | **Required** (allowed while `mustChangePassword` is true) |
| Required role | Any (COACH, PLAYER, SCOUT) |
| Backend owner | Backend (`app/api/auth/me/route.js`, `backend/middleware/auth.js`) |
| Frontend consumer | `authApi.fetchCurrentUser()` → `AuthProvider` (header, role home pages) |

**200**

```json
{
  "success": true,
  "message": "Authenticated",
  "data": {
    "user": { "id": "…", "name": "Coach Demo", "email": "coach@academy.test", "role": "COACH", "playerId": null },
    "homePath": "/coach"
  }
}
```

**401**

```json
{ "success": false, "message": "Authentication required", "errors": [{ "code": "UNAUTHENTICATED", "message": "Please log in to continue" }] }
```

Returned when there is no cookie, the token is tampered with or expired, the user no longer exists, the user is deactivated, or the session was ended by a password change or reset (`sv` mismatch).

`/me` stays available while `mustChangePassword` is true (the user object says so), so the UI can redirect to `/account/password`.

**Test scenarios:** no cookie → 401. Valid cookie → 200 with the user. Tampered token → 401. Expired token → 401. User deactivated after login → 401.

---

### 2.5 `POST /api/auth/register` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | Self-registration for Coach and Scout, gated by an access code. Logs the new user in. |
| Request body | `{ "name": "Coach Kim", "email": "kim@academy.test", "password": "secret123", "role": "COACH", "accessCode": "…" }` |
| Authentication | None (public) |
| Required role | N/A. `role` must be `COACH` or `SCOUT`; `PLAYER` is rejected (players are created by a Coach) |
| Validation | `name` 2–100 chars, `email` valid, `password` 8–128 chars, `role` ∈ {COACH, SCOUT}, `accessCode` required string |
| Backend owner | Backend (`app/api/auth/register/route.js`, `authService.registerUser`, `backend/utils/accessCode.js`) |
| Frontend consumer | `authApi.register()` → `RegisterForm` on `/register` |

**201** (+ `Set-Cookie: sa_session=…`): same `data` as login: `{ user, homePath }`. Message `Account created`.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` / `INVALID_FIELD` | Bad body or fields (including `role: "PLAYER"`) |
| 403 | `REGISTRATION_DISABLED` | No code configured for that role |
| 403 | `INVALID_ACCESS_CODE` | Wrong code (checked before email uniqueness) |
| 409 | `DUPLICATE` | Email already registered (`field: "email"`) |

**Test scenarios:** coach and scout register with correct codes, get a cookie and land on their home. Wrong code → 403, no user created. Code env unset → 403 `REGISTRATION_DISABLED`. `role: PLAYER` → 400. Duplicate email → 409. Weak password → 400.

---

### 2.6 `POST /api/auth/change-password` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | Change your own password; clears `mustChangePassword` |
| Request body | `{ "currentPassword": "Temp@1234", "newPassword": "MyNewPass99" }` |
| Authentication | **Required** (allowed even while `mustChangePassword` is true) |
| Required role | Any |
| Validation | `currentPassword` required. `newPassword` 8–128 chars and different from `currentPassword` |
| Effect | Hashes and saves the new password, sets `mustChangePassword: false`, increments `sessionVersion` (**all other sessions are signed out**), and sets a fresh cookie for the current browser |
| Backend owner | Backend (`app/api/auth/change-password/route.js`, `authService.changePassword`) |
| Frontend consumer | `authApi.changePassword()` → `ChangePasswordForm` on `/account/password` |

**200** (+ new `Set-Cookie`): `{ user, homePath }`, with message `Password changed`.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_FIELD` | Missing or weak new password, or new = current |
| 400 | `INVALID_CURRENT_PASSWORD` | Current password wrong (`field: "currentPassword"`) |
| 401 | `UNAUTHENTICATED` | No valid session |

**Test scenarios:** a Coach-created player logs in (`mustChangePassword: true`), is blocked from protected APIs with 403 `PASSWORD_CHANGE_REQUIRED`, changes the password and is unblocked. The old cookie stops working and the new cookie works. Wrong current password → 400. Same password → 400.

---

### 2.7 `POST /api/players` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | Create a player profile **and** its login account in one step |
| Request body | `{ "name": "Asha Rao", "age": 16, "sport": "cricket", "email": "asha@academy.test", "temporaryPassword": "Welcome@123" }` |
| Authentication | Required |
| Required role | COACH |
| Validation | `name` 2–100 chars. `age` integer 5–60 (a JSON number). `sport` 1–50 chars (normalized). `email` valid and unique across all users. `temporaryPassword` 8–128 chars |
| Effect | Creates a `Player` (with `createdBy` set to the coach) and a PLAYER `User` with `mustChangePassword: true`. If the user can't be created, the player is removed (no orphans) |
| Backend owner | Backend (`app/api/players/route.js`, `backend/services/playerService.js`, `backend/validators/playerValidator.js`) |
| Frontend consumer | `playersApi.createPlayer()` → `CreatePlayer` on `/coach/players/new` |

**201**

```json
{
  "success": true,
  "message": "Player created",
  "data": {
    "player": {
      "id": "…", "name": "Asha Rao", "age": 16, "sport": "Cricket", "isActive": true,
      "createdAt": "…", "updatedAt": "…",
      "account": { "userId": "…", "email": "asha@academy.test", "mustChangePassword": true }
    }
  }
}
```

The temporary password is never returned. The Coach already knows it and shares it with the player.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` / `INVALID_FIELD` | Bad body or fields |
| 401 / 403 | `UNAUTHENTICATED` / `FORBIDDEN` / `PASSWORD_CHANGE_REQUIRED` | Not signed in, not a Coach, or Coach has a temporary password |
| 409 | `DUPLICATE` | Email already used (`field: "email"`) |

**Player object** (used by every endpoint in this section): as above. `account` is `null` only for a profile with no login, which can't be created through this API.

---

### 2.8 `GET /api/players` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | List all academy players (shared academy: every Coach sees every player) |
| Query params | `sport` (normalized exact match), `status` = `active` · `inactive` · `all` (default `all`), `search` (case-insensitive substring of name or email, ≤ 100 chars) |
| Authentication | Required |
| Required role | COACH |
| Validation | Unknown `status` → 400 |
| Frontend consumer | `playersApi.listPlayers()` → `PlayerList` on `/coach/players` |

**200**: `{ "players": [Player, …], "count": 3 }`, sorted by name A–Z.

**Errors:** 400 `INVALID_FIELD`, and 401/403 as for 2.7.

---

### 2.9 `GET /api/players/:id` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | One player with account info |
| Authentication | Required |
| Required role | COACH |
| Frontend consumer | `playersApi.getPlayer()` → `PlayerDetails` on `/coach/players/:id` |

**200**: `{ "player": Player }`. **Errors:** 400 `INVALID_ID`, 404 `NOT_FOUND`, and 401/403.

---

### 2.10 `PATCH /api/players/:id` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | Update a player |
| Request body | Any subset of `{ "name", "age", "sport", "email", "isActive" }`. At least one is required; other fields are ignored |
| Authentication | Required |
| Required role | COACH |
| Validation | Same rules as create. `isActive` boolean. `email` unique |
| Effect | `name` is also copied to the login account. `email` updates the login email. `isActive: false` also **disables the player's login** (existing sessions stop working), and `true` re-enables it |

**200**: `{ "player": Player }`, message `Player updated`. **Errors:** 400 `INVALID_ID` / `INVALID_FIELD` (including an empty body), 404 `NOT_FOUND`, 409 `DUPLICATE` (email), 409 `NO_LOGIN_ACCOUNT` (email change on a profile without login), and 401/403.

---

### 2.11 `POST /api/players/:id/reset-password` – `IMPLEMENTED` (Phase 3)

| Item | Value |
| --- | --- |
| Purpose | Coach sets a new temporary password when a player forgets theirs |
| Request body | `{ "temporaryPassword": "Reset@5678" }` (8–128 chars) |
| Authentication | Required |
| Required role | COACH |
| Effect | New hash, `mustChangePassword: true`, `sessionVersion + 1` (the player is signed out everywhere) |

**200**: `{ "player": Player }`, message `Password reset`. **Errors:** 400, 404, 409 `NO_LOGIN_ACCOUNT`, and 401/403.

**Test scenarios for 2.7–2.11** (`tests/backend/players.integration.test.js`):
1. **Compulsory test 1:** create three players.
2. Sport normalized on save.
3. Duplicate email → 409, with no orphan player left.
4. Invalid fields → 400.
5. Non-coach → 403. Anonymous → 401.
6. A new player login has `mustChangePassword: true`.
7. List filters by sport, status and search.
8. Invalid id → 400. Unknown id → 404.
9. PATCH updates fields and syncs the account name and email.
10. Deactivating blocks the player's login.
11. Reset password signs the player out and forces a change.

---

### Practice sessions (Phase 4) – shared rules

- **Eligible player** (Q1): `isActive: true` **and** `sport` equal to the session's (normalized) sport. Eligibility is checked when attendance is marked and when the session is closed.
- **Lifecycle:** `OPEN` → (mark attendance, any number of times) → `CLOSED`. Closing is irreversible. **A closed session can never be modified** (409 `SESSION_CLOSED`).
- **Close requires complete attendance:** every currently eligible player must have a PRESENT or ABSENT record, otherwise 409 `ATTENDANCE_INCOMPLETE`. A session with no eligible players can be closed.
- **One record per player per session:** marking a player again while the session is open **replaces** their status. It never creates a duplicate.
- **Dates:** `date` is a calendar day `"YYYY-MM-DD"`, stored as UTC midnight. Multiple sessions on the same date and sport are allowed (Q7).
- Only CLOSED sessions count toward attendance % (Phase 6).

**Session object:**

```json
{
  "id": "…", "date": "2026-11-02", "sport": "Cricket", "status": "OPEN",
  "closedAt": null, "createdAt": "…", "updatedAt": "…",
  "summary": { "eligible": 3, "marked": 3, "present": 2, "absent": 1, "unmarked": 0 }
}
```

- For a CLOSED session, `summary.eligible` equals `marked`: the roster is frozen at close.
- `GET /api/sessions/:id` also returns `roster`, with entries sorted by name:

```json
"roster": [
  { "player": { "id": "…", "name": "Asha Rao", "age": 16, "isActive": true }, "status": "PRESENT", "markedAt": "…", "eligible": true },
  { "player": { "id": "…", "name": "Ben Thomas", "age": 17, "isActive": true }, "status": null, "markedAt": null, "eligible": true }
]
```

- **OPEN session:** every eligible player (`status: null` if not yet marked), plus anyone already marked who has since become ineligible (`eligible: false`; their record is kept).
- **CLOSED session:** exactly the attendance records.

---

### 2.12 `POST /api/sessions` – `IMPLEMENTED` (Phase 4)

| Item | Value |
| --- | --- |
| Purpose | Create a practice session (core rule #2) |
| Request body | `{ "date": "2026-11-02", "sport": "cricket" }` |
| Authentication / role | Required / COACH |
| Validation | `date` is a real calendar date in `YYYY-MM-DD` form, between 2000 and 2100. `sport` 1–50 chars (normalized) |
| Backend owner | Backend (`app/api/sessions/route.js`, `backend/services/sessionService.js`, `backend/validators/sessionValidator.js`) |
| Frontend consumer | `sessionsApi.createSession()` → `/coach/sessions/new` |

**201**: `{ "session": Session }` with status `OPEN` and message `Session created`. **Errors:** 400 `INVALID_JSON` / `INVALID_FIELD`, 401, 403.

---

### 2.13 `GET /api/sessions` – `IMPLEMENTED` (Phase 4)

| Item | Value |
| --- | --- |
| Purpose | List practice sessions, newest date first |
| Query params | `status` = `open` · `closed` · `all` (default `all`). `sport` (normalized exact match) |
| Authentication / role | Required / COACH |
| Frontend consumer | `sessionsApi.listSessions()` → `/coach/sessions` |

**200**: `{ "sessions": [Session, …], "count": n }`. **Errors:** 400 (bad `status`), 401, 403.

---

### 2.14 `GET /api/sessions/:id` – `IMPLEMENTED` (Phase 4)

| Item | Value |
| --- | --- |
| Purpose | One session with its attendance roster |
| Authentication / role | Required / COACH |
| Frontend consumer | `sessionsApi.getSession()` → `/coach/sessions/:id` |

**200**: `{ "session": Session & { roster } }`. **Errors:** 400 `INVALID_ID`, 404 `NOT_FOUND`, 401, 403.

---

### 2.15 `POST /api/sessions/:id/attendance` – `IMPLEMENTED` (Phase 4)

| Item | Value |
| --- | --- |
| Purpose | Mark eligible players PRESENT or ABSENT (core rule #3). It upserts: one record per player |
| Request body | `{ "records": [ { "playerId": "…", "status": "PRESENT" }, { "playerId": "…", "status": "ABSENT" } ] }` |
| Authentication / role | Required / COACH |
| Validation | `records` is a non-empty array (≤ 500 items). Each `playerId` is a valid id and appears **once per request**. `status` ∈ {PRESENT, ABSENT}. **Every player must be eligible**; otherwise nothing is saved |
| Effect | Records not in the request are left unchanged |
| Frontend consumer | `sessionsApi.markAttendance()` → attendance editor on `/coach/sessions/:id` |

**200**: `{ "session": Session & { roster } }`, with message `Attendance saved`.

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_FIELD` | Bad shape or status, or a duplicate `playerId` in the request |
| 400 | `NOT_ELIGIBLE` | One entry per ineligible player (unknown, inactive or different sport) |
| 404 | `NOT_FOUND` | Unknown session |
| 409 | `SESSION_CLOSED` | Session already closed |
| 409 | `CONFLICT` | Session changed concurrently, so retry |

---

### 2.16 `POST /api/sessions/:id/close` – `IMPLEMENTED` (Phase 4)

| Item | Value |
| --- | --- |
| Purpose | Close the session (core rules #4–5). Irreversible |
| Request body | None |
| Authentication / role | Required / COACH |
| Effect | `status: CLOSED`, `closedAt: now`. The attendance roster becomes read-only |
| Frontend consumer | `sessionsApi.closeSession()` → "Close session" on `/coach/sessions/:id` |

**200**: `{ "session": Session & { roster } }`, with message `Session closed`.

| Status | Code | When |
| --- | --- | --- |
| 404 | `NOT_FOUND` | Unknown session |
| 409 | `ATTENDANCE_INCOMPLETE` | Eligible players still unmarked (`errors` lists each: `{ code, field: "playerId", playerId, message }`) |
| 409 | `SESSION_CLOSED` | Already closed |
| 409 | `CONFLICT` | Attendance changed while closing, so retry |

**Test scenarios for 2.12–2.16** (`tests/backend/sessions.integration.test.js`):
- **Compulsory tests 2–4:** create one session, mark two players Present and one Absent, and verify the absent player is stored as ABSENT.
- Re-marking replaces the status, with no duplicate.
- Other sport, inactive or unknown player → 400 `NOT_ELIGIBLE`, and nothing saved.
- Duplicate `playerId` in one request → 400.
- Closing with unmarked players → 409 `ATTENDANCE_INCOMPLETE`.
- Close → 200. Marking or closing again → 409 `SESSION_CLOSED`.
- Roster is frozen after close.
- Invalid or unknown id → 400 / 404. Anonymous → 401. Player or scout → 403.

---

### Matches (Phase 5) – shared rules

- **Match eligibility** (core rule #7, Q3). A player can be a participant only if they:
  - are **active**,
  - play the match's **sport**, and
  - are marked **PRESENT** in at least one **CLOSED** session on the **same date** and **same sport**.

  Open sessions never count. The rule is checked on create and on every participant update. Matches whose players later become inactive keep their records.
- **One entry per player per match** (no duplicate participation). Each participant has exactly one score (core rule #8).
- **Score** (Q6): a number from 0 to 100000 (decimals allowed).
- `date` and `sport` are fixed after creation, because changing them would invalidate eligibility. `opponent` and `participants` can be edited.
- **Matches played** (Phase 6) = the number of matches in which the player is a participant.

**Match object** (list entries have no `participants` array):

```json
{
  "id": "…", "date": "2026-11-02", "sport": "Cricket", "opponent": "City XI",
  "createdAt": "…", "updatedAt": "…",
  "summary": { "participants": 2, "totalScore": 87, "topScore": 55, "topScorer": { "id": "…", "name": "Arjun Mehta" } },
  "participants": [
    { "player": { "id": "…", "name": "Arjun Mehta", "age": 16, "isActive": true }, "score": 55 },
    { "player": { "id": "…", "name": "Bela Singh", "age": 17, "isActive": true }, "score": 32 }
  ]
}
```

`participants` are sorted by score (highest first), then name. `topScorer` is `null` when there are no participants.

**Participant input** (create and update): `{ "playerId": "…", "score": 55 }`.

**`NOT_ELIGIBLE` messages** (`field` = `participants.<i>.playerId`):

| Situation | Message |
| --- | --- |
| Unknown player | `Player not found` |
| Inactive | `<name> is inactive` |
| Different sport | `<name> plays Football, not Cricket` |
| Marked ABSENT in the closed session | `<name> was absent on 2026-11-02` |
| No PRESENT record in a closed session | `<name> was not marked present in a closed Cricket session on 2026-11-02` |

---

### 2.17 `GET /api/matches/eligible-players` – `IMPLEMENTED` (Phase 5)

| Item | Value |
| --- | --- |
| Purpose | Who can be selected for a match on a date and sport |
| Query params | `date` (`YYYY-MM-DD`, required). `sport` (required, normalized) |
| Authentication / role | Required / COACH |
| Frontend consumer | `matchesApi.getEligiblePlayers()` → player picker on `/coach/matches/new` and the match edit view |

**200**

```json
{
  "date": "2026-11-02", "sport": "Cricket",
  "sessions": { "closed": 1, "open": 0 },
  "players": [ { "id": "…", "name": "Arjun Mehta", "age": 16 } ]
}
```

`sessions.open` lets the UI say "close today's session first". **Errors:** 400 `INVALID_FIELD`, 401, 403.

---

### 2.18 `POST /api/matches` – `IMPLEMENTED` (Phase 5)

| Item | Value |
| --- | --- |
| Purpose | Create a match with its participants and their scores (core rules #6–8) |
| Request body | `{ "date": "2026-11-02", "sport": "cricket", "opponent": "City XI", "participants": [ { "playerId": "…", "score": 55 } ] }` |
| Authentication / role | Required / COACH |
| Validation | `date` is a real calendar date. `sport` 1–50 chars. `opponent` 1–100 chars. `participants` 1–100 entries, each with a valid id appearing **once** and a valid score. **Every participant must be eligible**, otherwise nothing is saved |
| Backend owner | Backend (`app/api/matches/route.js`, `backend/services/matchService.js`, `backend/validators/matchValidator.js`) |
| Frontend consumer | `matchesApi.createMatch()` → `/coach/matches/new` |

**201**: `{ "match": Match }`, with message `Match created`. **Errors:** 400 `INVALID_JSON` / `INVALID_FIELD` / `NOT_ELIGIBLE`, 401, 403.

---

### 2.19 `GET /api/matches` – `IMPLEMENTED` (Phase 5)

| Item | Value |
| --- | --- |
| Purpose | List matches, newest date first |
| Query params | `sport` (optional, normalized) |
| Authentication / role | Required / COACH |
| Frontend consumer | `matchesApi.listMatches()` → `/coach/matches` |

**200**: `{ "matches": [Match (no participants)], "count": n }`. **Errors:** 401, 403.

---

### 2.20 `GET /api/matches/:id` – `IMPLEMENTED` (Phase 5)

**200**: `{ "match": Match }`. **Errors:** 400 `INVALID_ID`, 404 `NOT_FOUND`, 401, 403. Role: COACH. Consumer: `/coach/matches/:id`.

---

### 2.21 `PATCH /api/matches/:id` – `IMPLEMENTED` (Phase 5)

| Item | Value |
| --- | --- |
| Purpose | Correct the opponent or the participants and scores |
| Request body | Any of `{ "opponent": "…", "participants": [ { "playerId", "score" } ] }`. At least one is required. `participants` **replaces** the whole list |
| Validation | Same as create. Eligibility is re-checked for every participant |
| Authentication / role | Required / COACH |

**200**: `{ "match": Match }`, with message `Match updated`. **Errors:** 400 `INVALID_ID` / `INVALID_FIELD` / `NOT_ELIGIBLE`, 404, 409 `CONFLICT` (edited concurrently), 401, 403.

**Test scenarios for 2.17–2.21** (`tests/backend/matches.integration.test.js`):
- **Compulsory tests 5–7:** create a same-day match, allow the two present players, and reject the absent player.
- Players from an open session, a different date or a different sport are rejected.
- Inactive player → rejected. Duplicate player in one match → 400. Invalid scores → 400.
- The eligible-players lookup reports closed and open session counts.
- PATCH re-checks eligibility and replaces scores.
- List is newest first. Invalid or unknown ids → 400 / 404. Anonymous → 401. Player or scout → 403.

---

### Readiness (Phase 6) – shared rules

Readiness is **calculated on every request from the database**. It is never stored and never hardcoded (core rules #9–10).

| Value | Definition |
| --- | --- |
| `completedSessions` | CLOSED sessions in which the player has an attendance record (Q4). Open sessions are ignored |
| `sessionsAttended` | Of those, sessions where the player is PRESENT |
| `attendancePercent` | `sessionsAttended / completedSessions × 100`, rounded to 1 decimal **for display only**. 0 when `completedSessions` is 0 |
| `matchesPlayed` | Matches in which the player is a participant |
| `isReady` | `completedSessions > 0` **and** `sessionsAttended × 100 ≥ 75 × completedSessions` (exact, so 75% qualifies; Q5) **and** `matchesPlayed ≥ 2` |

**Readiness object:**

```json
{
  "isReady": true, "attendancePercent": 75, "sessionsAttended": 3, "completedSessions": 4, "matchesPlayed": 2,
  "requirements": { "minAttendancePercent": 75, "minMatchesPlayed": 2 }
}
```

**Performance object:** `{ "totalScore": 87, "averageScore": 43.5, "bestScore": 55 }`. `averageScore` and `bestScore` are `null` with no matches. `averageScore` is rounded to 1 decimal.

**Player performance detail** (§2.23–2.24, §2.26):

```json
{
  "profile": { "id": "…", "name": "Arjun Mehta", "age": 16, "sport": "Cricket", "isActive": true },
  "readiness": { … }, "performance": { … },
  "attendance": [ { "sessionId": "…", "date": "2026-11-02", "sport": "Cricket", "status": "PRESENT" } ],
  "matches": [ { "matchId": "…", "date": "2026-11-02", "sport": "Cricket", "opponent": "City XI", "score": 55 } ]
}
```

- `attendance` lists closed sessions only, newest first. `matches` is newest first.
- **Readiness row** (list endpoints): `{ "player": { id, name, age, sport, isActive }, "readiness": {…}, "performance": {…} }`, sorted by name.

---

### 2.22 `GET /api/coach/dashboard` – `IMPLEMENTED` (Phase 6)

| Item | Value |
| --- | --- |
| Purpose | Readiness of every player in the academy |
| Query params | `sport` (normalized). `readiness` = `all` · `ready` · `not_ready` (default `all`) |
| Authentication / role | Required / COACH |
| Frontend consumer | `readinessApi.getCoachDashboard()` → `/coach/readiness`, coach overview |

**200**: `{ "summary": { "players": 5, "ready": 2, "notReady": 3 }, "players": [Readiness row] }`. `summary` counts the whole academy, before filters. **Errors:** 400 (bad `readiness`), 401, 403.

---

### 2.23 `GET /api/players/:id/performance` – `IMPLEMENTED` (Phase 6)

Coach view of one player's performance and readiness. **200**: the player performance detail. **Errors:** 400 `INVALID_ID`, 404 `NOT_FOUND`, 401, 403. Role: COACH. Consumer: performance section on `/coach/players/:id`.

---

### 2.24 `GET /api/player/dashboard` – `IMPLEMENTED` (Phase 6)

| Item | Value |
| --- | --- |
| Purpose | The signed-in player's own profile, attendance, matches and readiness (core rule #12) |
| Request params | **None.** The player is taken from the session (`User.player`). There is no way to ask for another player |
| Authentication / role | Required / PLAYER |
| Frontend consumer | `readinessApi.getPlayerDashboard()` → `/player` |

**200**: the player performance detail for the signed-in player. **Errors:** 401, 403 (non-player or temporary password), 404 `NO_PLAYER_PROFILE` (account not linked to a profile).

---

### 2.25 `GET /api/scout/players` – `IMPLEMENTED` (Phase 6)

| Item | Value |
| --- | --- |
| Purpose | **Ready** players only (core rule #11) |
| Query params | `sport` (optional, normalized) |
| Authentication / role | Required / SCOUT |
| Rules | Only players that are **active and Ready** are returned. No emails or account data are included |
| Frontend consumer | `readinessApi.listReadyPlayers()` → `/scout` |

**200**: `{ "players": [Readiness row], "count": n }`. **Errors:** 401, 403.

---

### 2.26 `GET /api/scout/players/:id` – `IMPLEMENTED` (Phase 6)

Scout view of one Ready player (the player performance detail). A player who is not Ready or not active returns **404 `NOT_FOUND`**, exactly like an unknown id, so scouts can't learn that a non-Ready player exists. **Errors:** 400 `INVALID_ID`, 404, 401, 403. Role: SCOUT. Consumer: `/scout/players/:id`.

**Test scenarios for 2.22–2.26** (`tests/backend/readiness*.test.js`):
- **Compulsory test 8:** attendance below 75% (2 of 3) → not Ready.
- **Compulsory test 9:** exactly 75% (3 of 4) and 2 matches → Ready. 75% with 1 match → not Ready.
- **Compulsory test 10:** the scout list contains Ready players only. The detail for a non-Ready player → 404.
- **Compulsory test 11:** the player dashboard returns only the signed-in player's data. A player calling `/api/players/:id`, `/api/players/:id/performance` or the scout endpoints → 403.
- Open sessions don't affect attendance %. An inactive Ready player is hidden from scouts.
- Coach dashboard filters work. Every endpoint: anonymous → 401, wrong role → 403.

---

## 3. Proposed endpoints

None. Every endpoint in the original plan is now `IMPLEMENTED`. New endpoints (for example, from the surprise requirement) start here as `DRAFT`.

---

## 4. Assumptions and open questions

These must be confirmed (or changed by official requirements) before the phase that depends on them.

| # | Topic | Current assumption | Needed by |
| --- | --- | --- | --- |
| Q1 | Eligible player | **Decided (Phase 4):** `isActive: true` and `sport` equal to the session or match sport | ✅ |
| Q2 | Sport matching | **Decided (Phase 3):** normalize on save (collapse spaces, Title Case), then match exactly. See §1.4 | ✅ |
| Q3 | Same-day match | **Decided (2026-11-03):** a player may join a match only if a **CLOSED** session with the same calendar date and same sport has them marked PRESENT. Open sessions don't count, so attendance is final before match selection and records stay consistent | ✅ |
| Q4 | Attendance % denominator | **Decided (Phase 6):** PRESENT count / CLOSED sessions in which the player has a record × 100. Open sessions are excluded. 0 completed sessions → 0%, not Ready | ✅ |
| Q5 | Rounding | **Decided (Phase 6):** compare exactly with integers (`attended × 100 ≥ 75 × completed`), so exactly 75% qualifies. Round to 1 decimal only for display | ✅ |
| Q16 | Scout visibility | **Decided (Phase 6):** scouts see only players who are active **and** Ready, without email or account data. Non-Ready players look "not found" | ✅ |
| Q6 | Score | **Decided (Phase 5):** a number from 0 to 100000 (decimals allowed), exactly one per participating player | ✅ |
| Q15 | Multiple matches per day | Allowed (e.g. a double-header). A player may appear in each, and each counts as a match played | ✅ |
| Q7 | Multiple sessions per day | **Decided (Phase 4):** allowed. Any PRESENT record for that date and sport satisfies Q3 | ✅ |
| Q12 | Closing rule | **Decided (Phase 4):** a session closes only when every eligible player is marked, so each eligible player has a record in every closed session of their sport (keeps Q4 exact). Closed sessions are immutable | ✅ |
| Q13 | Future dates | Sessions may be created for any date (planning ahead). Attendance and closing aren't restricted by date (timezone-safe). Revisit if a rule is announced | Phase 6 |
| Q14 | Mistaken sessions | There's no edit or delete for sessions yet. A wrongly created OPEN session can be left unused; it doesn't count until closed | Phase 7 |
| Q8 | Player accounts | **Decided (Phase 3):** the Coach creates the player's login together with the profile (email + temporary password). The player must change it on first login. One `User` per `Player` (unique index) | ✅ |
| Q9 | Self-registration | **Decided (Phase 3):** Coach and Scout self-register with an access code. Players can't self-register | ✅ |
| Q10 | Academy scope | **Decided (Phase 3):** one shared academy. Every Coach sees and manages all players | ✅ |
| Q11 | Brute force | There's no login or access-code rate limiting yet (serverless memory isn't shared). Revisit in Phase 7 if time allows | Phase 7 |
