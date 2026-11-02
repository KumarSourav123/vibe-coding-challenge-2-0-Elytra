# AI Prompt Templates

Copy a template and replace `<…>` placeholders. Every template assumes the agent has the repository open.

---

## 1. Master project instructions (start of every session)

```text
You are working on the Sports Academy Management System: one Next.js App Router app in JavaScript
with Tailwind CSS v4, MongoDB Atlas + Mongoose, and Next.js Route Handlers as the backend.

Read first: MASTER_DEVELOPMENT_PROMPT.md, docs/TEAM_DEVELOPMENT_GUIDE.md, docs/API_CONTRACTS.md,
docs/DEVELOPMENT_ROADMAP.md, docs/FEATURE_TRACKER.md, and docs/BACKEND.md or docs/FRONTEND.md.

My role: <FRONTEND DEVELOPER | BACKEND DEVELOPER>. Current phase: <N>.
Only modify files my role owns. Report any needed change to another owner's or a shared file
instead of making it. Do NOT run git commit/push/pull/merge/checkout/reset.
Do not implement features from later phases.
Do not add any authentication SDK or library (NextAuth/Auth.js, Clerk, bcrypt, jose, ...).
Auth is built in-house: backend/utils/password.js (scrypt) and lib/authToken.js (HMAC tokens).
Protect APIs with requireAuth/requireRole from backend/middleware/auth.js.
When done: run npm run lint, npm test and npm run build; report changed files and results.
Never claim a check passed without running it.
```

## 2. Backend feature implementation

```text
Implement the backend for <feature> (Phase <N>) exactly as specified in docs/API_CONTRACTS.md §<x>.
- Models in backend/models (extend existing ones; no duplicate models).
- Business logic in backend/services/<feature>Service.js; throw AppError for expected failures.
- Request validation in backend/validators.
- Thin route handlers in app/api/... using successResponse and handleRouteError.
- Enforce auth and role with the guards in backend/middleware. Derive player identity from the
  session, never from the request.
- Add Vitest tests in tests/backend using the in-memory MongoDB, covering every test scenario
  in the contract plus 401/403/400/404/409 cases.
Update docs/FEATURE_TRACKER.md. Do not touch frontend/.
```

## 3. Frontend feature implementation

```text
Implement the frontend for <feature> (Phase <N>) from docs/API_CONTRACTS.md §<x>.
- Mocks in frontend/features/<feature>/mocks matching the contract exactly. Invent no fields.
- API functions in frontend/features/<feature>/api that handle the success/error envelope.
- Components in frontend/features/<feature>/components using frontend/components/ui.
- Pages in app/<route>/page.js.
- Handle loading, empty, error and success states, and keep the layout responsive.
- Temporarily point the API function at mocks behind a single switch, ready for integration.
Do not modify backend/, lib/ or app/api/.
```

## 4. API integration

```text
Integrate <feature>: the backend is merged to main and its contract is IMPLEMENTED.
- Switch frontend/features/<feature>/api from mocks to the real endpoints.
- Verify every state against a real database: success, validation errors, 401/403, empty data.
- List any mismatch between the contract and the actual responses. Do not silently adapt either side.
- Run lint, tests and build. Update FEATURE_TRACKER.md to INTEGRATED.
```

## 5. Testing

```text
Write and run tests for <feature/scenario>.
Cover: the happy path, invalid input, unauthenticated access, wrong role, a player accessing
another player's data, closed-session edits, duplicate attendance/participation, and the
relevant compulsory competition test cases (MASTER_DEVELOPMENT_PROMPT.md §10).
Use real (in-memory) MongoDB records. Report the exact command output.
```

## 6. Bug fixing

```text
Bug: <observed behaviour>. Expected: <expected behaviour>. Steps: <steps>.
Find the root cause before changing code. Make the smallest fix within my role's files.
Add a regression test that fails before the fix and passes after.
Do not rewrite unrelated working code or suppress errors. Run lint, tests and build.
```

## 7. Final review

```text
Review the repository for submission:
- Every core business rule (§1) and compulsory test case (§10) is implemented and tested.
- Security checklist (§11): no secrets in client code, .env.local not committed, hashed passwords,
  backend authorization, player data isolation, scout sees Ready only, closed sessions immutable.
- No dev-only tools, mocks in production paths, duplicate routes or duplicate models.
- Docs are consistent with the code (API_CONTRACTS, FEATURE_TRACKER, README).
- npm run lint, npm test and npm run build all pass.
Report findings ranked by severity. Do not perform git operations.
```
