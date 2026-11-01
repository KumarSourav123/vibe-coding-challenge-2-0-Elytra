# Frontend Architecture & Developer Guide
## Sports Academy Management System (Apex Sports Academy)
### 7-Day Vibe Coding Challenge – Phase 1 Foundation

---

## 1. Overview & Responsibilities

As the **Frontend Developer**, all UI components, user interaction flows, client-side state, styling systems, and mock data strategies are owned within:
- `frontend/`
- Frontend-related pages inside `app/` (e.g., `app/page.js`, `app/layout.js`, `app/globals.css`)
- UI assets inside `public/`

### Strict File Ownership Boundaries
- **Frontend owns**:
  - `frontend/components/` (Reusable atomic UI elements, common containers, navigations)
  - `frontend/features/` (Feature-sliced modules: health, roles, landing)
  - `frontend/hooks/` (Custom React client hooks)
  - `frontend/utils/` (Client API fetch wrappers, formatters)
  - `app/layout.js`, `app/page.js`, `app/globals.css`
- **Frontend must NOT modify independently**:
  - `backend/`
  - `lib/mongodb.js`
  - `app/api/`
  - Backend models or services

---

## 2. Folder Structure

```text
frontend/
├── components/
│   └── common/
│       ├── Button.js          # Reusable athletic button (variants: primary, secondary, outline, danger, ghost)
│       ├── Card.js            # Card, CardHeader, CardTitle, CardContent, CardFooter
│       ├── Badge.js           # Multi-variant badges (success, warning, ready, danger, neutral)
│       ├── Navbar.js          # Sticky header with navigation links, logo, and live health indicator
│       ├── Footer.js          # Academy footer with rules summary, tech stack, and competition note
│       └── AppLayout.js       # Client layout wrapper managing health polling and navigation
│
├── features/
│   ├── health/
│   │   ├── components/
│   │   │   ├── HealthStatusCard.js      # Main interactive database health monitor with diagnostics & mocks
│   │   │   └── HealthIndicatorPill.js   # Compact indicator pill for Navbar and cards
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js        # React hook for automated health polling & simulation mode
│   │   ├── services/
│   │   │   └── healthApi.js             # API service pinging GET /api/health with latency benchmark
│   │   └── mocks/
│   │       └── healthMock.js            # Contract-compliant mock responses for offline testing
│   │
│   ├── roles/
│   │   ├── components/
│   │   │   ├── RoleCard.js              # Interactive role card with rule badges & workflow preview modal
│   │   │   └── RoleShowcase.js          # Grid container for Coach, Player, and Scout portals
│   │   └── data/
│   │       └── rolesData.js             # Centralized role definitions, permissions, and rules
│   │
│   └── landing/
│       └── components/
│           ├── HeroBanner.js            # High-impact sports hero section with readiness stat callouts
│           ├── AcademyRulesSection.js   # Visual breakdown of the 12 core competition rules
│           └── TechStackSection.js      # Architecture overview (Next.js, Tailwind, MongoDB Atlas)
│
└── utils/
    └── api.js                           # Standardized fetch wrapper with timeouts and JSON parsing
```

---

## 3. UI Component System & Athletic Design Language

### Styling Philosophy
The system implements a high-performance sports academy aesthetic:
- **Palette**: Deep slate dark mode (`#0B1120`, `#111827`) with Emerald Green accents (`#10B981`) for readiness and health, Vibrant Amber (`#F59E0B`) for session alerts, and Electric Cyan (`#3B82F6`) for technical metrics.
- **Glassmorphism**: Subtle backdrops with `backdrop-filter: blur(12px)` and bordered cards (`border-slate-800`).
- **Responsive Layout**: Fluid breakpoints from mobile (360px) up to ultra-wide displays (1440px+).

### Component API Reference

#### `Button`
```jsx
import Button from '@/frontend/components/common/Button';

<Button
  variant="primary" // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent'
  size="md"         // 'sm' | 'md' | 'lg'
  isLoading={false}
  leftIcon={<Activity className="w-4 h-4" />}
  onClick={handleClick}
>
  Inspect Database Health
</Button>
```

#### `Badge`
```jsx
import Badge from '@/frontend/components/common/Badge';

<Badge variant="ready" size="lg" dot>
  Ready for Match (>=75% Attendance & >=2 Matches)
</Badge>
```

#### `Card`
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/frontend/components/common/Card';

<Card hoverEffect>
  <CardHeader>
    <CardTitle>Practice Session</CardTitle>
  </CardHeader>
  <CardContent>Attendance is immutable once closed.</CardContent>
</Card>
```

---

## 4. Database Health Monitoring & API Contract (`GET /api/health`)

The health monitoring feature integrates with the backend API handler as defined in the master specification.

### API Contract (`GET /api/health`)
- **Endpoint**: `/api/health`
- **Method**: `GET`
- **Auth**: None (Public diagnostic route)
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "System is healthy and database is connected",
    "data": {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2026-11-01T18:52:22.000Z",
      "environment": "development",
      "latencyMs": 42,
      "services": {
        "mongodb": "connected",
        "apiRoute": "active"
      }
    }
  }
  ```
- **Error Response (`503 Service Unavailable`)**:
  ```json
  {
    "success": false,
    "message": "Database connection failed or MONGODB_URI not configured",
    "data": {
      "status": "unhealthy",
      "database": "disconnected",
      "timestamp": "2026-11-01T18:52:22.000Z"
    },
    "errors": ["Unable to establish connection to MongoDB Atlas."]
  }
  ```

### State Management in Frontend (`useHealthCheck`)
The `useHealthCheck` hook manages three distinct visual states:
1. **Loading State (`loading`)**:
   - Indicator: Pulsing amber badge with spinning icon.
   - User messaging: *"Connecting / Checking database connectivity..."*
2. **Connected State (`connected`)**:
   - Indicator: Pulsing emerald badge, live latency counter, verified status.
   - User messaging: *"Atlas Connected • MongoDB Atlas Online & Synced"*
3. **Disconnected State (`disconnected`)**:
   - Indicator: Rose alert badge, actionable error helper.
   - User messaging: Explains that backend `/api/health` or `MONGODB_URI` in `.env.local` is awaiting configuration.

### Interactive Mock Simulation Mode
In development, reviewers and frontend engineers can toggle between:
- **Real API**: Live network fetch to `/api/health`.
- **Mock Connected**: Simulates a healthy 200 response with simulated latency.
- **Mock Disconnected**: Simulates a 503 response with diagnostic troubleshooting notes.

---

## 5. Phase 1 Stakeholder Roles Showcase

Three dedicated role cards were created in `frontend/features/roles/`:
1. **Coach Portal**:
   - Roster creation, practice session scheduling, immutable attendance locking, match creation, and scoring.
   - Highlights Rule #5 (Closed sessions cannot be modified) and Rule #7 (Only present players participate in matches).
2. **Player Portal**:
   - Isolated self-service dashboard to view attendance %, match history, and readiness progress.
   - Highlights Rule #12 (Strict player data isolation).
3. **Scout Talent Hub**:
   - Exclusive pipeline restricted to competition-ready athletes.
   - Highlights Rule #10 (Readiness: Attendance &ge; 75% AND &ge; 2 matches) and Rule #11 (Scouts can never see non-ready players).

Each card features an interactive modal previewing the role's forthcoming Phase 2-6 workflow.

---

## 6. How to Run the Frontend Locally

### Prerequisites
- Node.js (v18 or higher; tested on Node v25.9.0)
- npm 10+

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build Verification
```bash
npm run build
npm run start
```
`next build` will statically generate all pages and verify type and syntax integrity.

---

## 7. Next Steps for Phase 2 Handoff

When transitioning to **Phase 2 (Authentication and Role Management)**:
1. Backend developer merges User model, JWT/session middleware, and `POST /api/auth/login`.
2. Frontend developer will build the Login UI (`app/login/page.js`), role switcher, protected route guards, and role redirect handlers for `/coach`, `/player`, and `/scout`.

