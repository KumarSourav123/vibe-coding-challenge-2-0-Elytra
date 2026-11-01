# MASTER DEVELOPMENT INSTRUCTIONS
# SPORTS ACADEMY MANAGEMENT SYSTEM
## 7-Day Vibe Coding Competition

---

## 0. SELECT YOUR DEVELOPER ROLE

Before starting, select your role:

- `BACKEND DEVELOPER`
- `FRONTEND DEVELOPER`

We have two developers working on two separate laptops using Anti-gravity and Gemini. Both have cloned the same GitHub repository and work on separate branches.

- Developer 1: FRONTEND DEVELOPER
- Developer 2: BACKEND DEVELOPER

Both developers have access to the complete repository.

**Important:** Do not create separate frontend and backend applications. We are building one integrated Next.js application.

All Git operations will be performed manually by the developers, not by AI agents.

---

## 1. PROJECT OBJECTIVE

Build a Sports Academy Management System with three user roles:

### Coach
- Add and manage players.
- Create practice sessions.
- Mark attendance.
- Close practice sessions.
- Create matches.
- Record individual player scores.
- View player performance and readiness.

### Player
- View their own profile.
- View their own attendance.
- View their own match history.
- View their readiness status.

### Scout
- View only players who satisfy the readiness requirements.
- View relevant player information and performance.

### Core business rules

1. Coach creates players with name, age and sport.
2. Coach creates practice sessions with date and sport.
3. Coach marks each eligible player Present or Absent.
4. Coach closes the session after attendance.
5. Closed sessions cannot be modified.
6. Coach creates matches with date, sport and opponent.
7. Only eligible players who were present on the same date and sport can be included in that day's match.
8. Each participating player receives a recorded score.
9. Attendance percentage is calculated from actual completed practice sessions.
10. A player is Ready only if:
    - Attendance is at least 75%.
    - They have played at least 2 matches.
11. Scout can see only Ready players.
12. Player can see only their own records.

Do not change these core rules without an official competition requirement.

---

## 2. TECHNOLOGY STACK

Use:

- Next.js
- Next.js App Router
- JavaScript (not TypeScript)
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- Next.js Route Handlers for backend APIs
- GitHub for version control
- Vercel for deployment

Do not introduce:
- Express as a separate backend server.
- A second frontend application.
- Unnecessary frameworks.
- Unnecessary paid services.
- Complex architecture that is not required by the problem.

Keep the application suitable for deployment on Vercel.

---

## 3. PROJECT ARCHITECTURE

Use one Next.js application with clearly separated frontend and backend responsibilities.

Recommended structure:

```text
sports-academy/
│
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.js
│   │   ├── auth/
│   │   ├── players/
│   │   ├── sessions/
│   │   ├── matches/
│   │   ├── coach/
│   │   ├── player/
│   │   └── scout/
│   │
│   ├── login/
│   ├── coach/
│   ├── player/
│   ├── scout/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
│
├── frontend/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   └── utils/
│
├── backend/
│   ├── models/
│   ├── services/
│   ├── validators/
│   ├── middleware/
│   └── utils/
│
├── lib/
│   ├── mongodb.js
│   └── shared utilities
│
├── tests/
├── docs/
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is the intended architecture, not a requirement to create every folder immediately. Create folders when needed. Do not create unnecessary empty files.

Important architectural rules:

- `app/` contains Next.js pages and API route handlers.
- `frontend/` contains reusable UI components, feature components, hooks and frontend utilities.
- `backend/` contains database models, services, validation and backend utilities.
- `lib/` contains shared infrastructure utilities.
- `tests/` contains automated tests.
- `docs/` contains project documentation.
- Do not create another Next.js application inside `frontend/`.
- Do not create another server inside `backend/`.

---

## 4. STRICT FILE OWNERSHIP

Both developers have the complete repository on their laptops. They can read the entire codebase, but must primarily modify their assigned files.

### FRONTEND DEVELOPER owns
- `frontend/`
- Frontend-related pages inside `app/`
- UI-related files inside `public/`
- Frontend documentation where assigned

Must not independently modify:
- `backend/`
- `lib/mongodb.js`
- `app/api/`
- Backend models or services

### BACKEND DEVELOPER owns
- `backend/`
- `lib/`
- `app/api/`
- Backend tests
- Backend documentation where assigned

Must not independently modify:
- Frontend components
- Frontend styling
- Frontend feature files

### Shared files

The following files require coordination:

- `package.json`
- `package-lock.json`
- `next.config.js`
- `jsconfig.json`
- `.gitignore`
- `app/layout.js`
- `app/globals.css`
- `README.md`
- Shared documentation

If a shared file needs modification, inform the other developer before changing it. Never independently overwrite another developer's work.

**Documentation ownership:** The backend developer owns creating and maintaining the shared documents in `docs/`. The frontend developer must read and follow them, and should report requested changes rather than independently creating competing versions.

---

## 5. API CONTRACT RULES

This is one of the most important requirements of the entire project.

Frontend and backend must never independently invent API structures.

Before implementing any feature, define its API contract in:

`docs/API_CONTRACTS.md`

Every endpoint must specify:

1. Endpoint URL.
2. HTTP method.
3. Purpose.
4. Request parameters.
5. Request body.
6. Successful response.
7. Error response.
8. Authentication requirement.
9. Required role.
10. Validation rules.
11. Backend owner.
12. Frontend consumer.
13. Test scenarios.

Use consistent endpoint naming.

Examples:

```text
POST   /api/auth/login

POST   /api/players
GET    /api/players
GET    /api/players/:id
PATCH  /api/players/:id

POST   /api/sessions
GET    /api/sessions
GET    /api/sessions/:id

POST   /api/sessions/:id/attendance
POST   /api/sessions/:id/close

POST   /api/matches
GET    /api/matches

GET    /api/player/dashboard
GET    /api/scout/players
GET    /api/coach/dashboard
```

These are proposed endpoint names. Finalize request and response details in the API contract before implementation.

Use a consistent response structure.

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

Important:

- Frontend must follow the documented endpoint and response structure.
- Backend must follow the same contract.
- Never change a contract silently.
- If a change is necessary, update the documentation and inform the other developer.
- Keep API routes thin and move business logic into reusable backend services.
- For player-specific APIs, derive the authenticated player's identity from the server-side session. Do not trust a player ID supplied by the client to decide whose records can be accessed.

---

## 6. DEVELOPMENT STRATEGY

Follow feature-based development.

Do not finish the entire frontend first and the entire backend later.

For each feature, follow:

**PLAN → API CONTRACT → PARALLEL FRONTEND AND BACKEND DEVELOPMENT → INDEPENDENT TESTING → INTEGRATION → REGRESSION TESTING → FEATURE COMPLETE**

Example: Player Management

Backend:
- Create Player model.
- Implement Add Player API.
- Implement Get Players API.
- Implement Get Player API.
- Implement Update Player API.
- Add validation.
- Add authorization.
- Test APIs.

Frontend:
- Create player listing page.
- Create Add Player form.
- Create player details page.
- Create Edit Player form.
- Add loading and error states.
- Use mock data matching the API contract.

Both developers can work simultaneously.

---

## 7. FRONTEND MOCK DATA STRATEGY

Frontend development must not wait for backend completion.

For every feature:

1. Read the agreed API contract.
2. Create mock data matching the exact response.
3. Build and test the complete UI using mock data.
4. Keep mock data separate from production API logic.
5. Prepare a clean API service function.
6. Replace mock data with actual API responses during integration.

Example:

`frontend/features/player/mocks/playerMock.js`

Never use mock data as actual production data. Never independently invent response fields.

---

## 8. BACKEND TESTING STRATEGY

Backend development must include proper verification.

For each feature:

1. Implement models.
2. Implement APIs.
3. Implement business services.
4. Add validation.
5. Add authorization.
6. Test using Postman or automated tests.
7. Verify actual MongoDB operations.

A temporary development-only testing UI may be created when it helps interactive verification.

Example: `/dev-tools/players`

The temporary UI must:

- Call actual APIs.
- Use actual MongoDB records.
- Show successful responses.
- Show validation errors.
- Allow relevant CRUD testing.

It must not weaken production authentication or authorization. Keep temporary tools inaccessible in production.

Remove temporary testing pages and components before integration, but retain actual APIs, models, services and automated tests.

Do not create temporary UI if automated tests and Postman already provide sufficient verification.

---

## 9. SEVEN DEVELOPMENT PHASES

Create a complete roadmap in `docs/DEVELOPMENT_ROADMAP.md`.

Break every phase into small tasks with:
- Objective.
- Backend tasks.
- Frontend tasks.
- Dependencies.
- Expected output.
- Testing requirements.
- Completion criteria.

### PHASE 1 – Project Foundation

- Next.js project setup.
- Folder architecture.
- MongoDB connection utility.
- Initial database models.
- Health-check API.
- Basic landing page.
- Reusable UI components.
- Frontend/API health integration.
- Initial documentation.
- Local development verification.

### PHASE 2 – Authentication and Role Management

- User model.
- Coach, Player and Scout roles.
- Secure login.
- Password hashing.
- Session/token handling.
- Login UI.
- Role-based redirects.
- Protected APIs.
- Authentication testing.

### PHASE 3 – Player Management

- Player database model.
- Add player API.
- Get players API.
- Get player by ID API.
- Update player API.
- Player listing UI.
- Add player form.
- Player details UI.
- Validation and authorization.

### PHASE 4 – Practice Sessions and Attendance

- Session model.
- Create session API.
- Get sessions API.
- Attendance data structure.
- Mark attendance API.
- Close session API.
- Session listing UI.
- Attendance marking UI.
- Closed session protection.
- Attendance testing.

### PHASE 5 – Match Management and Scoring

- Match model.
- Create match API.
- Get matches API.
- Player participation records.
- Score recording.
- Match listing UI.
- Match creation UI.
- Score entry UI.
- Same-date and same-sport attendance validation.
- Match testing.

### PHASE 6 – Readiness and Role-Based Access

- Attendance percentage calculation.
- Match count calculation.
- Readiness service.
- Coach dashboard.
- Player dashboard.
- Scout dashboard.
- Ready-player filtering.
- Player data isolation.
- Permission testing.

Readiness rule:

```text
READY =
Attendance >= 75%
AND
Matches Played >= 2
```

Use actual database records. Do not hardcode readiness results.

Use only appropriate completed sessions in attendance calculations. Do not count open sessions.

For same-day match validation, define how attendance records correspond to a match date and sport. If the requirement is ambiguous, document the assumption and seek clarification rather than inventing a different rule.

### PHASE 7 – Testing, UI and Deployment

- Complete API testing.
- Complete role testing.
- Frontend/backend integration.
- End-to-end testing.
- Error handling.
- UI improvements.
- Responsive design.
- Production build.
- Vercel deployment.
- Live URL verification.
- Final GitHub verification.

---

## 10. COMPULSORY COMPETITION TEST CASES

These scenarios must be implemented and verified:

1. Create three players.
2. Create one practice session.
3. Mark two players Present and one Absent.
4. Verify the absent player is recorded correctly.
5. Create a same-day match.
6. Allow the two present players to participate.
7. Reject the absent player.
8. Verify that attendance below 75% does not qualify as Ready.
9. Verify that exactly 75% attendance and two matches qualifies as Ready.
10. Verify Scout sees only Ready players.
11. Verify Player sees only their own records.

Also test:

- Unauthenticated API access.
- Unauthorized role access.
- A player attempting to access another player's data.
- Editing a closed session.
- Duplicate attendance or match participation.
- Invalid request data.

---

## 11. SECURITY AND TECHNICAL WARNINGS

Follow these rules throughout the project:

1. Never expose MongoDB URI in frontend code.
2. Never commit `.env.local`.
3. Maintain `.env.example` with placeholders.
4. Never store plain-text passwords.
5. Enforce authorization on the backend.
6. Never trust client-supplied user IDs for access control.
7. Protect player data from other players.
8. Protect Scout access to non-Ready players.
9. Closed sessions must be immutable.
10. Validate match participation against attendance.
11. Calculate readiness from actual database records.
12. Prevent duplicate records.
13. Avoid duplicate API routes and models.
14. Keep mock data separate from production logic.
15. Keep temporary development tools inaccessible in production.
16. Do not modify shared files without coordination.
17. Never merge untested code.
18. Never suppress errors just to make a build pass.
19. Never rewrite unrelated working functionality.
20. Keep the project deployable throughout development.

---

## 12. GIT COLLABORATION

Use three primary branches:

```text
main
frontend
backend
```

Responsibilities:

- `main`: Stable integrated project.
- `frontend`: Frontend developer's work.
- `backend`: Backend developer's work.

Both developers begin from the same initial main branch. They work independently and push changes to their respective branches.

Recommended integration sequence:

1. Review backend branch.
2. Merge tested backend changes into main.
3. Synchronize frontend branch with updated main.
4. Connect frontend to actual APIs.
5. Test the integrated feature.
6. Review and merge frontend into main.
7. Both developers synchronize their branches.

All Git operations are manual.

AI agents must not:
- Commit.
- Push.
- Pull.
- Merge.
- Switch branches.
- Reset branches.
- Resolve Git conflicts independently.

Never use destructive Git commands casually. One developer should coordinate shared configuration and dependency changes.

---

## 13. REQUIRED PROJECT DOCUMENTATION

Create and maintain these files inside `docs/`.

### 1. TEAM_DEVELOPMENT_GUIDE.md

Contains:
- Project overview.
- Developer responsibilities.
- Folder ownership.
- Collaboration rules.
- Development workflow.
- Git workflow.
- Integration procedure.
- Technical warnings.

### 2. API_CONTRACTS.md

Contains:
- All agreed API endpoints.
- Methods.
- Request structures.
- Response structures.
- Error formats.
- Roles and authorization.
- Validation.
- Test cases.

### 3. FEATURE_TRACKER.md

Track each feature with:
- Backend status.
- Frontend status.
- API contract status.
- Independent testing status.
- Integration status.
- Final status.

Use these statuses:

- PENDING
- IN PROGRESS
- TESTING
- READY FOR INTEGRATION
- INTEGRATED
- COMPLETE

### 4. DEVELOPMENT_ROADMAP.md

Contains:
- Seven phases.
- Small development tasks.
- Task dependencies.
- Developer ownership.
- Expected output.
- Completion criteria.
- Daily milestones.

### 5. AI_PROMPT_TEMPLATES.md

Contains reusable prompts for:
- Master project instructions.
- Backend feature implementation.
- Frontend feature implementation.
- API integration.
- Testing.
- Bug fixing.
- Final review.

All documents must remain consistent with each other.

---

## 14. ENVIRONMENT VARIABLES

Create `.env.example`.

Initially:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_NAME=Sports Academy
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add authentication-related secrets only when the chosen authentication implementation requires them.

The developers will manually:
- Create MongoDB Atlas cluster.
- Create database user.
- Configure network access.
- Obtain connection URI.
- Create local `.env.local`.
- Configure Vercel environment variables.

Do not attempt to create MongoDB accounts or clusters.

Do not expose private environment variables through frontend code.

---

## 15. IMPORTANT COMPETITION RULES

- Maintain a working application every day.
- Keep changes small and testable.
- Follow the official competition requirements if they change.
- Keep architecture modular enough to accommodate surprise requirements.
- Complete the required daily Git commit.
- Verify daily pushes.
- Never push after the official competition End deadline.
- Do not spend too much time on optional features before core functionality works.

The official surprise requirement announced on 4 November at 11:00 IST may change priorities. Update the roadmap and feature tracker if necessary, without breaking existing functionality.

---

## 16. TODAY'S ASSIGNMENT – PHASE 1 ONLY

This is the only implementation phase to execute now.

Do not start Phase 2 or any later phase.

### BACKEND DEVELOPER – TODAY

1. Inspect the existing repository.
2. Create backend folder structure.
3. Create reusable MongoDB connection utility.
4. Create initial User model.
5. Create initial Player model.
6. Create initial Session model.
7. Create initial Match model.
8. Create `GET /api/health`.
9. Add proper error handling.
10. Create backend documentation.
11. Verify database connectivity when `.env.local` is configured.
12. Run relevant checks and production build.

### FRONTEND DEVELOPER – TODAY

1. Inspect the existing repository.
2. Create frontend folder structure.
3. Create basic application layout.
4. Create professional landing page.
5. Create Coach, Player and Scout role cards.
6. Create reusable UI components.
7. Create database health status component.
8. Connect to `GET /api/health`.
9. Add loading, connected and disconnected states.
10. Create frontend documentation.
11. Run development server and production build.

### SHARED COMPLETION TARGET

At the end of Phase 1:

- Both developers understand the project architecture.
- Folder responsibilities are clear.
- MongoDB connection works.
- Initial models exist.
- Health-check endpoint works.
- Landing page works.
- Frontend displays actual database connection status.
- Both developers can run the project locally.
- Documentation is ready for Phase 2.

Do not implement authentication or any other future-phase business logic today.

---

## 17. AI AGENT EXECUTION RULES

Before coding:

1. Inspect the existing repository.
2. Read available project documentation.
3. Check the current folder structure.
4. Check `package.json` and installed dependencies.
5. Identify files owned by your role.
6. Identify any shared-file changes required.

During coding:

1. Work in small steps.
2. Explain the planned changes.
3. Create actual files in the opened cloned repository.
4. Write complete working code.
5. Follow the agreed architecture.
6. Avoid unnecessary dependencies.
7. Do not overwrite unrelated files.
8. Do not implement features outside today's phase.

After coding:

1. Run relevant tests.
2. Run lint checks.
3. Run the production build.
4. Fix errors.
5. Report all changed files.
6. Explain how to run the application.
7. Report what still needs the other developer.
8. Never claim a test passed without executing it.

If a task requires modifying a file owned by the other developer, report the requirement instead of silently modifying that file.

---

# FINAL INSTRUCTION

First inspect the cloned repository.

Then execute ONLY the tasks belonging to your selected developer role for Phase 1.

Create the documentation needed to guide the entire seven-day competition.

Do not perform Git operations.

Do not build future-phase features prematurely.

Your objective is to create a clean, modular and working foundation that can be extended feature by feature until the final competition submission.
