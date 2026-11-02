# Team Development Guide

## 1. Project overview

Sports Academy Management System: a single Next.js application (App Router, JavaScript, Tailwind CSS, MongoDB Atlas via Mongoose, Next.js Route Handlers as the backend, deployed on Vercel).

Roles:

- **Coach** – manages players, practice sessions, attendance, matches and scores; views performance and readiness.
- **Player** – views only their own profile, attendance, match history and readiness.
- **Scout** – views only Ready players and their relevant performance.

Core rules are listed in [MASTER_DEVELOPMENT_PROMPT.md §1](../MASTER_DEVELOPMENT_PROMPT.md). They must not change without an official competition requirement.

## 2. Developer responsibilities

| Developer | Branch | Owns |
| --- | --- | --- |
| Developer 1 – Frontend | `frontend` | `frontend/`, page files in `app/` (except `app/api/`), UI assets in `public/`, `docs/FRONTEND.md` |
| Developer 2 – Backend | `backend` | `backend/`, `lib/`, `app/api/`, `tests/backend/`, all other `docs/` files |

## 3. Folder ownership

| Path | Owner | Notes |
| --- | --- | --- |
| `app/api/**` | Backend | Thin route handlers: parse → call service → respond |
| `app/**/page.js` (non-API) | Frontend | Pages compose components from `frontend/` |
| `backend/models` | Backend | One model per entity. No duplicates. |
| `backend/services` | Backend | All business rules live here |
| `backend/validators` | Backend | Request validation (created in Phase 2/3) |
| `backend/middleware` | Backend | Auth/role guards (created in Phase 2) |
| `backend/utils` | Backend | `apiResponse`, `errors`, `constants`, `schemaHelpers` |
| `lib/` | Backend | `mongodb.js` and shared server infrastructure |
| `frontend/components` | Frontend | Reusable UI and layout |
| `frontend/features/<feature>` | Frontend | `api/` service functions, `components/`, `hooks/`, `mocks/` |
| `tests/backend` | Backend | |
| `tests/frontend` | Frontend | |
| `docs/` | Backend maintains | Frontend requests changes; never creates competing versions |

**Shared files (coordinate before changing):** `package.json`, `package-lock.json`, `next.config.js`, `jsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mjs`, `.gitignore`, `.env.example`, `app/layout.js`, `app/globals.css`, `README.md`.

## 4. Collaboration rules

1. The API contract in `docs/API_CONTRACTS.md` is agreed **before** either side implements a feature.
2. Neither side invents fields. Contract changes are made in the doc first, and the other developer is told.
3. Frontend builds against mocks in `frontend/features/<feature>/mocks/` that match the contract exactly.
4. If you need a change in a file you don't own, report it to the owner instead of editing it.
5. One developer at a time changes dependencies (`npm install`), and announces it so the other runs `npm install` after syncing.

## 5. Development workflow (per feature)

```text
PLAN → API CONTRACT → PARALLEL FE + BE → INDEPENDENT TESTING → INTEGRATION → REGRESSION → COMPLETE
```

- **Backend:** model → service → validation → authorization → route → automated tests (Vitest + in-memory MongoDB) → verify against Atlas.
- **Frontend:** read contract → mocks → UI with loading/empty/error states → API service function → swap mock for real call at integration.
- Before handing off, run: `npm run lint && npm test && npm run build`.
- Update `docs/FEATURE_TRACKER.md` when a status changes.

## 6. Git workflow

Branches: `main` (stable, integrated), `frontend`, `backend`. **All Git operations are done manually by the developers. AI agents must never commit, push, pull, merge, switch, reset branches or resolve conflicts.**

Daily:

1. Sync your branch with `main` before starting.
2. Commit small, tested changes with clear messages.
3. Push your branch at least once per day (competition requirement). Never push after the official deadline.

## 7. Integration procedure

1. Backend branch reviewed: lint, tests and build pass.
2. Merge `backend` → `main`.
3. Frontend merges updated `main` into `frontend`.
4. Frontend swaps mocks for the real API service and tests against a real database.
5. Run the full regression: `npm run lint && npm test && npm run build`, plus a manual check of every role flow.
6. Merge `frontend` → `main`.
7. Both developers sync with `main`.

## 8. Technical warnings

- Never expose `MONGODB_URI` or any secret in frontend code. Only `NEXT_PUBLIC_*` variables reach the browser.
- Never import `backend/` or `lib/mongodb.js` from a `"use client"` component.
- Never commit `.env.local`. Keep `.env.example` up to date with placeholders.
- Never store plain-text passwords (Phase 2 hashes them).
- Authorization is always enforced on the backend. Never trust a client-supplied user or player ID for access control. Derive identity from the server-side session.
- Closed sessions are immutable. Match participation is validated against attendance. Readiness is calculated from real records, never hardcoded.
- Prevent duplicates: one attendance record per player per session, one participation per player per match, unique user emails.
- Keep dev-only tools (e.g. `/dev-tools/*`) unreachable in production, and remove them before integration.
- Never suppress errors or disable lint rules just to make a build pass.
- Keep the app deployable at the end of every day.
