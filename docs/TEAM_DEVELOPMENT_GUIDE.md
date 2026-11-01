# TEAM DEVELOPMENT GUIDE
## Sports Academy Management System (Vibe Coding Challenge 2.0)

---

## 1. Project Overview

The Sports Academy Management System is an integrated Next.js application designed to manage academy operations with three distinct user roles:
- **Coach**: Player management, practice session creation, attendance recording/closing, match creation, and score entry.
- **Player**: Personal profile, attendance tracking, match history, and readiness status.
- **Scout**: Read-only view of verified "Ready" players meeting attendance and match participation thresholds.

### Core Business Rules
1. **Coach creates players** with name, age, and sport.
2. **Coach creates practice sessions** with date and sport.
3. **Coach marks attendance** for each player as `present` or `absent`.
4. **Coach closes the session** after marking attendance.
5. **Closed sessions are strictly immutable** (cannot be modified or edited).
6. **Coach creates matches** with date, sport, and opponent.
7. **Same-day & same-sport match eligibility**: Only players marked `present` in a closed practice session for that exact date and sport can participate in that match.
8. **Each participating player receives a recorded score**.
9. **Attendance percentage** is computed solely from completed/closed practice sessions.
10. **Readiness formula**:
   $$\text{READY} \iff \text{Attendance} \ge 75\% \land \text{Matches Played} \ge 2$$
11. **Scouts can only access Ready players**. Non-ready players are completely filtered out on the server side.
12. **Players can access only their own records**. Strict data isolation is enforced at the API layer.

---

## 2. Developer Roles & Strict File Ownership

| Role | Laptop / Branch | Primary File Ownership | Restricted Paths (Read-Only) |
|---|---|---|---|
| **Backend Developer** | `backend` branch | `backend/`, `lib/`, `app/api/`, backend tests, `docs/` | `frontend/`, UI components, page styling |
| **Frontend Developer** | `frontend` branch | `frontend/`, `app/**/page.js` UI, `public/` | `backend/`, `lib/mongodb.js`, `app/api/` |

### Shared Files (Coordination Required)
Modifications to these files require mutual agreement between developers:
- `package.json` & `package-lock.json`
- `next.config.js`
- `jsconfig.json`
- `.gitignore`
- `app/layout.js`
- `app/globals.css`
- `README.md`
- Shared documentation in `docs/`

> **Note on Documentation**: The Backend Developer owns and maintains the authoritative shared documents inside `docs/`. The Frontend Developer follows them and requests revisions through coordination.

---

## 3. Architecture & Directory Structure

```text
sports-academy/
├── app/
│   ├── api/                     # Next.js Route Handlers (Backend API)
│   │   ├── health/route.js      # Health check endpoint
│   │   ├── auth/                # Authentication routes (Phase 2)
│   │   ├── players/             # Player CRUD routes (Phase 3)
│   │   ├── sessions/            # Practice session routes (Phase 4)
│   │   ├── matches/             # Match routes (Phase 5)
│   │   ├── coach/               # Coach dashboard data (Phase 6)
│   │   ├── player/              # Player dashboard data (Phase 6)
│   │   └── scout/               # Scout filtered player data (Phase 6)
│   ├── layout.js                # Root layout (Shared)
│   ├── page.js                  # Landing page (Frontend)
│   └── globals.css              # Global styles & Tailwind directives
│
├── frontend/                    # Owned by Frontend Developer
│   ├── components/              # Reusable UI components (buttons, cards, badges)
│   ├── features/                # Domain-specific UI features (auth, player, session, match)
│   ├── hooks/                   # Custom client-side hooks
│   └── utils/                   # Frontend helpers & formatting utilities
│
├── backend/                     # Owned by Backend Developer
│   ├── models/                  # Mongoose database models
│   ├── services/                # Reusable business logic (Readiness, Eligibility)
│   ├── validators/              # Request payload validation schemas
│   ├── middleware/              # Auth & Role verification middlewares
│   └── utils/                   # API response formatters & error handlers
│
├── lib/                         # Shared infrastructure
│   └── mongodb.js               # Cached Mongoose connection utility
│
├── docs/                        # Authoritative Project Documentation
├── tests/                       # Automated backend tests
├── public/                      # Static assets
├── .env.example                 # Environment variable templates
└── package.json                 # Dependency definitions
```

---

## 4. Development Workflow & API-First Principles

1. **Plan & Contract**: Prior to coding any feature, the API contract is finalized in `docs/API_CONTRACTS.md`.
2. **Parallel Execution**:
   - Backend implements Mongoose models, validation, route handler, and automated verification.
   - Frontend creates mock fixtures matching the exact API contract shape and implements UI components, loading states, and error handling.
3. **Independent Verification**:
   - Backend tests API endpoints with actual database records.
   - Frontend verifies complete UX with mock data.
4. **Integration**:
   - Frontend switches API call from mock to live `/api/*` endpoint.
   - Both verify happy path and edge-case errors.

---

## 5. Git Collaboration Rules

- **Three Primary Branches**:
  - `main`: Production-ready, stable, integrated code.
  - `frontend`: Frontend developer active branch.
  - `backend`: Backend developer active branch.
- **Manual Git Operations**:
  - **All git commands (branching, commits, pushes, pulls, merges) are performed manually by the developers.**
  - AI coding assistants must NEVER run `git commit`, `git push`, `git merge`, or `git checkout`.
- **Merge Sequence**:
  1. Backend feature tested and merged into `main`.
  2. Frontend synchronizes with `main`.
  3. Frontend switches mock service to actual endpoint.
  4. Integration tested end-to-end.
  5. Frontend feature merged into `main`.

---

## 6. Security and Technical Invariants

1. **No Client-Side Secrets**: Never expose `MONGODB_URI` or private secrets to client components.
2. **Backend-Enforced Authorization**: Client claims are never trusted for authorization; user identity is derived server-side from validated session tokens.
3. **Immutable Practice Sessions**: Once a practice session's `status` is set to `'closed'`, any update or attendance change is rejected with `400 Bad Request`.
4. **Strict Eligibility**: Match participation queries MUST join or validate against closed session attendance on that match's exact date and sport.
5. **Data Isolation**: A player user can NEVER view other players' scores or attendance.
6. **Scout Isolation**: Scout queries MUST filter by `isReady === true` on the database/service layer.

