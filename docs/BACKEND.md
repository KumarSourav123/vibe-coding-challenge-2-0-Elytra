# Backend Guide

The backend is the API routes in `app/api/` plus the server-only code in `backend/` and `lib/`. There's no separate server. See [ARCHITECTURE.md](ARCHITECTURE.md) for the big picture and [API_CONTRACTS.md](API_CONTRACTS.md) for every endpoint.

---

## How a request is handled

```text
app/api/<feature>/route.js   1. requireRole()       who is calling?   (backend/middleware/auth.js)
                             2. validate…Input()    is the input OK?  (backend/validators/)
                             3. <service function>  apply the rules   (backend/services/)
                             4. successResponse()   standard reply    (backend/utils/apiResponse.js)
                             catch → handleRouteError()  standard error (backend/utils/errors.js)
```

- **Routes stay thin.** Every rule lives in a service.
- **Expected failures** (not found, not allowed, invalid) are thrown as `AppError(message, status, errors)`.

---

## Files

### `backend/services/`: business rules, one per feature

| File | Does |
| --- | --- |
| `authService.js` | Login, create an academy (with its Head Coach), join with a code, change password, session tokens |
| `academyService.js` | Academies, join codes (create, look up, regenerate), academy overview and rename |
| `playerService.js` | Create a player with their login, list, get, update, reset password |
| `sessionService.js` | Practice sessions: create, list, roster, mark attendance, close |
| `matchService.js` | Matches: eligible players, create, list, get, update |
| `readinessService.js` | Ready rule (`computeReadiness`), coach dashboard, player dashboard, scout list |
| `evaluationService.js` | Demo codes and logins for judges (only when `EVALUATION_MODE=true`) |
| `healthService.js` | Database health check |

### `backend/validators/`: input checks

One file per feature, plus `common.js` (shared checks for text, email, new password, whole numbers and booleans). Non-string input is always rejected, which also blocks NoSQL-injection tricks like `{ "$ne": null }`.

### `backend/models/`: database shapes

`Academy`, `User`, `Player`, `Session`, `Match`. Import them from `@/backend/models`. Every model except Academy has a required, indexed `academy` field.

### `backend/utils/`: shared helpers

| File | Does |
| --- | --- |
| `academyScope.js` | `findInAcademyOrThrow()`, `assertValidId()`, `notFoundError()`, `conflictError()`: the one way to load a record by id |
| `apiResponse.js` / `errors.js` | Standard success and error replies, `AppError`, `handleRouteError()` |
| `password.js` | scrypt hashing and checking (Node's built-in crypto) |
| `joinCode.js` | Generate and normalize join codes (`XXXX-XXXX-XXXX`) |
| `date.js` / `sport.js` | `"YYYY-MM-DD"` dates, and sport names (`"cricket "` → `"Cricket"`) |
| `constants.js` | Roles, statuses, Ready thresholds (75%, 2 matches) |
| `demoAccounts.js` | The demo academy and accounts used by `npm run seed` |
| `request.js` / `schemaHelpers.js` | Safe JSON body reading, and shared model pieces |

### `backend/middleware/auth.js`

| Guard | Allows |
| --- | --- |
| `requireAuth(request)` | Any signed-in user with an academy, who isn't on a temporary password |
| `requireRole(request, ROLES.COACH, …)` | Only the listed roles |
| `requireHeadCoach(request)` | Only the academy's Head Coach |

### `lib/`

`mongodb.js` (cached connection), `authToken.js` (signed tokens and cookie settings, using Web Crypto), and `roles.js` (role → home page).

---

## The rules to keep

1. **Always scope by academy.** Take `academyId` from the session user (`user.academy`). Load records with `findInAcademyOrThrow(Model, id, academyId, "Entity")`, and add `academy` to every query. Never accept an academy id from the request.
2. **Never trust ids from the browser for permissions.** A player's own data comes from `user.player`.
3. **Closed sessions are final.** Session writes use a compare-and-set on `{ status: "OPEN", __v }`. Don't call `save()` on a session.
4. **Readiness is calculated, never stored.**
5. **Passwords are always hashed** with `hashPassword()`. The User model rejects anything else.

---

## Tests

- `npm test` runs every test against a temporary in-memory MongoDB. Atlas is never touched.
- **Helpers** in `tests/helpers/`:
  - `startTestDatabase` / `stopTestDatabase`
  - `createUser` (pass `academy`) and `loginAs`
  - `makeRequest` / `sessionCookieFrom`
- Create a test academy with `createAcademy()` from `academyService`.
- Dynamic routes take `(request, { params: Promise.resolve({ id }) })`.

---

## Scripts

`npm run seed` creates the demo academy and accounts. `npm run migrate:academy` is the one-time upgrade for data created before academies existed. Both read `.env.local`. See [DEPLOYMENT.md](DEPLOYMENT.md).
