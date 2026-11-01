# DEVELOPMENT ROADMAP (7-DAY COMPETITION)
## Sports Academy Management System

---

## Phase 1: Project Foundation (Day 1)
- **Objective**: Establish the core Next.js architecture, Mongoose connection infrastructure, initial database schemas, health-check endpoint, and base documentation.
- **Backend Tasks**:
  - Setup Next.js with App Router, JavaScript, and Mongoose.
  - Implement cached connection in `lib/mongodb.js`.
  - Design initial database models: `User`, `Player`, `Session`, `Match`.
  - Implement `GET /api/health` with error handling and fallback states.
  - Create complete documentation suite in `docs/`.
  - Verify local production build.
- **Frontend Tasks**:
  - Setup application layout (`app/layout.js`, `app/globals.css`).
  - Implement landing page with role overview cards.
  - Create database connection health status badge consuming `GET /api/health`.
  - Implement loading, connected, and degraded states.
- **Dependencies**: None.
- **Expected Output**: Working Next.js application with operational health-check endpoint displaying live DB status.
- **Completion Criteria**: Clean build passing with zero errors; `/api/health` returning valid contract JSON.

---

## Phase 2: Authentication & Role Management (Day 2)
- **Objective**: Secure role-based authentication system supporting Coach, Player, and Scout accounts.
- **Backend Tasks**:
  - Implement password hashing (bcryptjs) and JWT / secure HTTP-only cookies.
  - Build `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
  - Implement role verification middleware (`verifyAuth`, `requireRole(['coach'])`).
- **Frontend Tasks**:
  - Build login interface with role-selection tabs.
  - Setup auth context / session state.
  - Route redirection based on role (`/coach`, `/player`, `/scout`).
- **Dependencies**: Phase 1 foundation and User model.
- **Expected Output**: Secure login protecting authenticated API routes and pages.
- **Completion Criteria**: Unauthorized requests receive `401`/`403`; valid credentials authenticate successfully.

---

## Phase 3: Player Management (Day 3)
- **Objective**: Complete CRUD lifecycle for players under coach management.
- **Backend Tasks**:
  - Implement `POST /api/players` (add player with name, age, sport).
  - Implement `GET /api/players` (list players with sport filter).
  - Implement `GET /api/players/:id` and `PATCH /api/players/:id`.
  - Enforce coach-only authorization and payload validation.
- **Frontend Tasks**:
  - Build coach player management dashboard.
  - Create add-player modal/form with validation.
  - Create player roster cards / data table.
- **Dependencies**: Phase 2 authentication.
- **Expected Output**: Coach can create and update academy players.
- **Completion Criteria**: 3+ players created and verified in MongoDB.

---

## Phase 4: Practice Sessions & Attendance (Day 4)
- **Objective**: Session scheduling, attendance tracking, and immutable session locking.
- **Backend Tasks**:
  - Implement `POST /api/sessions` (date, sport).
  - Implement `POST /api/sessions/:id/attendance` (mark present/absent per player).
  - Implement `POST /api/sessions/:id/close` (set status to closed).
  - Enforce immutability: reject changes to closed sessions with `400 Bad Request`.
- **Frontend Tasks**:
  - Session creation view.
  - Interactive attendance roster (Present / Absent toggles).
  - "Close Session" confirmation flow with locked status indicator.
- **Dependencies**: Phase 3 players.
- **Expected Output**: Closed sessions stored with immutable attendance records.
- **Completion Criteria**: Test Case 2-4 verified: 2 players present, 1 absent; session locked permanently.

---

## Phase 5: Match Management & Scoring (Day 5)
- **Objective**: Match creation with eligibility validation against same-day closed session attendance.
- **Backend Tasks**:
  - Implement `POST /api/matches` (date, sport, opponent, participating players with score).
  - Implement validation: verify every participant was marked `present` in a closed practice session on the match's exact date and sport.
  - Reject absent or non-attending players.
- **Frontend Tasks**:
  - Match creation form.
  - Eligible player selector (automatically filtered by same-day attendance).
  - Individual score entry inputs.
- **Dependencies**: Phase 4 attendance.
- **Expected Output**: Verified matches with participation and individual scores.
- **Completion Criteria**: Test Case 5-7 verified: present players accepted; absent player rejected.

---

## Phase 6: Readiness Engine & Role Dashboards (Day 6)
- **Objective**: Automated readiness computation and role-specific data isolation.
- **Backend Tasks**:
  - Implement Readiness Service:
    $$\text{Attendance} \ge 75\% \land \text{Matches} \ge 2 \implies \text{READY}$$
  - Implement `GET /api/scout/players` (strictly filters for `isReady: true`).
  - Implement `GET /api/player/dashboard` (strictly isolated to authenticated player).
  - Implement `GET /api/coach/dashboard` (summary statistics).
- **Frontend Tasks**:
  - Coach analytics dashboard (readiness overview).
  - Scout player directory (ready talent cards with stats).
  - Player self-service dashboard (attendance progress bar, match history).
- **Dependencies**: Phase 4 & 5 data.
- **Expected Output**: Accurate readiness calculation and isolated role views.
- **Completion Criteria**: Test Cases 8-11 verified: 75% + 2 matches = Ready; Scout sees only Ready; Player sees self only.

---

## Phase 7: Comprehensive Testing, UI Polish & Vercel Deployment (Day 7)
- **Objective**: End-to-end verification, regression testing, responsive design, and live deployment.
- **Backend Tasks**:
  - Run full automated regression suite.
  - Security audit: verify auth bypass resistance and injection prevention.
  - Verify Vercel serverless function compatibility.
- **Frontend Tasks**:
  - UI/UX polish, micro-interactions, responsive mobile views.
  - Error toast notifications and optimistic UI states.
- **Shared Tasks**:
  - Production build verification (`npm run build`).
  - Deploy to Vercel and verify live production URL.
  - Final GitHub repository review.

