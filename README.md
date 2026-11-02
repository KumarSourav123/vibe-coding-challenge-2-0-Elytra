# Sports Academy Management System

One integrated **Next.js (App Router, JavaScript)** application with **Tailwind CSS**, **MongoDB Atlas** and **Mongoose**, deployable to **Vercel**. Coaches manage players, practice attendance and matches; players see their own records; scouts see only Ready players.

> Status: **Phase 4 – Practice Sessions and Attendance complete.** See [docs/FEATURE_TRACKER.md](docs/FEATURE_TRACKER.md).

## Quick start

Requirements: Node.js 20.9+ (tested on Node 25), npm.

```bash
npm install
cp .env.example .env.local     # then set MONGODB_URI, AUTH_SECRET, signup codes, SEED_PASSWORD
npm run seed                   # creates demo coach / scout / player accounts
npm run dev                    # http://localhost:3000
```

Generate `AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Sign in at `/login` with `coach@academy.test`, `player@academy.test` or `scout@academy.test` and your `SEED_PASSWORD`. Each role lands in its own area (`/coach`, `/player`, `/scout`). The landing page's **System status** section shows the live result of `GET /api/health`.

How accounts are created:

| Role | How |
| --- | --- |
| Player | The Coach adds the player at `/coach/players/new` (profile + login email + temporary password) and shares the details. The player must choose a new password at first sign-in. There's no player sign-up. |
| Coach / Scout | Self-register at `/register` with the access code from `COACH_SIGNUP_CODE` / `SCOUT_SIGNUP_CODE` |

All coaches share one academy, so every coach sees every player.

Authentication is built only from Node's built-in crypto: scrypt password hashing and HMAC-signed HttpOnly session cookies. No auth SDK is used.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals rules) |
| `npm test` | Vitest: unit tests + MongoDB integration tests (in-memory MongoDB, no Atlas needed) |
| `npm run seed` | Create demo accounts in the database from `.env.local` (dev only; skips existing accounts) |

The first `npm test` downloads a MongoDB binary (~100 MB) for `mongodb-memory-server`; later runs are cached.

## Environment variables

| Name | Scope | Description |
| --- | --- | --- |
| `MONGODB_URI` | Server only | MongoDB Atlas connection string. Never use in frontend code. |
| `AUTH_SECRET` | Server only | ≥ 32 random characters, used to sign session cookies. Rotating it signs everyone out. |
| `COACH_SIGNUP_CODE` | Server only | Access code for coach self-registration (≥ 8 chars). Empty means coach sign-up is disabled. |
| `SCOUT_SIGNUP_CODE` | Server only | Access code for scout self-registration (≥ 8 chars). Empty means scout sign-up is disabled. |
| `SEED_PASSWORD` | Dev only | Password for accounts created by `npm run seed`. Not needed on Vercel. |
| `NEXT_PUBLIC_APP_NAME` | Public | Display name (default "Sports Academy") |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL, e.g. `http://localhost:3000` |

`.env.local` is git-ignored. Configure the same variables in Vercel → Project → Settings → Environment Variables.

## Folder structure

```text
app/                 Next.js pages and API route handlers
  api/health/        GET /api/health
  api/auth/          login, logout, me, register, change-password
  api/players/       Player CRUD + reset-password (coach only)
  api/sessions/      Sessions, attendance, close (coach only)
  (site)/            Public landing page (header + footer layout)
  (auth)/            /login and /register (focused, centered layout)
  (app)/             Signed-in area with sidebar (AppShell), protected by proxy.js:
    coach/           Overview, players (list/add/details), sessions (list/new/attendance)
    player/ scout/   Role overviews
    account/password Change password (required after a temporary password)
  layout.js, globals.css  Root layout (Inter font, AuthProvider) and design tokens
backend/             Server-only code (never import from client components)
  models/            Mongoose models: User, Player, Session, Match
  services/          Business logic (routes stay thin)
  validators/        Request validation
  middleware/        requireAuth / requireRole guards
  utils/             Response helpers, error handling, password hashing, constants
lib/                 Shared server infrastructure
  mongodb.js         Cached MongoDB connection
  authToken.js       Signed session tokens + cookie settings
  roles.js           Role → home path mapping
proxy.js             Page-level route protection (Next.js 16 Proxy)
scripts/             CLI tools (seed.mjs + alias loader)
frontend/            UI code
  components/ui/     Reusable UI: Button, Card, Badge, Spinner, Container
  components/layout/ SiteHeader, SiteFooter
  features/<name>/   Feature folders: api/, components/, hooks/, mocks/, data/
  utils/             cn(), public config
tests/               Vitest suites (backend/, frontend/, helpers/)
docs/                Project documentation (start here)
```

## Documentation

- [Team Development Guide](docs/TEAM_DEVELOPMENT_GUIDE.md) – roles, ownership, workflow, Git rules
- [API Contracts](docs/API_CONTRACTS.md) – the single source of truth for every endpoint
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) – seven phases, tasks, daily milestones
- [Feature Tracker](docs/FEATURE_TRACKER.md) – status of every feature
- [Backend Guide](docs/BACKEND.md) · [Frontend Guide](docs/FRONTEND.md)
- [AI Prompt Templates](docs/AI_PROMPT_TEMPLATES.md)
- [Master Development Prompt](MASTER_DEVELOPMENT_PROMPT.md)
