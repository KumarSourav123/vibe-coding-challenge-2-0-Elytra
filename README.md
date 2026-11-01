# Sports Academy Management System
## 7-Day Vibe Coding Challenge 2.0

An integrated Next.js application designed to manage sports academy operations across Coach, Player, and Scout roles with database-backed attendance tracking, match eligibility validation, and readiness scoring.

---

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB Atlas with Mongoose
- **Styling**: Tailwind CSS
- **Deployment**: Vercel ready

---

## 📁 Repository Structure
```text
├── app/
│   ├── api/
│   │   └── health/route.js      # Health check endpoint
│   ├── globals.css              # Global styling & Tailwind directives
│   ├── layout.js                # Root application layout
│   └── page.js                  # Landing page
├── backend/                     # Backend domain logic (Owned by Backend Dev)
│   ├── models/                  # Mongoose models: User, Player, Session, Match
│   ├── services/                # Decoupled business logic (Readiness, Eligibility)
│   ├── validators/              # Payload validation rules
│   ├── middleware/              # Auth & Role verification middlewares
│   └── utils/                   # API response formatters & error handlers
├── frontend/                    # UI feature components (Owned by Frontend Dev)
│   ├── components/              # Shared UI components
│   ├── features/                # Domain-specific UI features & mocks
│   ├── hooks/                   # Custom client hooks
│   └── utils/                   # Frontend helpers
├── lib/                         # Shared infrastructure
│   └── mongodb.js               # Cached Mongoose connection utility
├── docs/                        # Complete project documentation
│   ├── TEAM_DEVELOPMENT_GUIDE.md# Architecture & collaboration rules
│   ├── API_CONTRACTS.md         # Authoritative API specifications
│   ├── FEATURE_TRACKER.md       # Live implementation tracking matrix
│   ├── DEVELOPMENT_ROADMAP.md   # 7-day milestones & task breakdown
│   └── AI_PROMPT_TEMPLATES.md   # Standardized AI prompts
├── tests/                       # Automated backend test suites
│   └── verify-phase1.js         # Phase 1 model & route verification
├── .env.example                 # Environment variable templates
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm
- MongoDB Atlas cluster connection URI

### 2. Setup Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```
Configure your MongoDB connection string in `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sports_academy?retryWrites=true&w=majority
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Phase 1 Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
Health check endpoint is live at [http://localhost:3000/api/health](http://localhost:3000/api/health).

### 6. Production Build
```bash
npm run build
```

---

## 📖 Documentation
All architectural specifications, API contracts, and development guides are maintained in [`docs/`](./docs/):
- [`docs/TEAM_DEVELOPMENT_GUIDE.md`](./docs/TEAM_DEVELOPMENT_GUIDE.md)
- [`docs/API_CONTRACTS.md`](./docs/API_CONTRACTS.md)
- [`docs/FEATURE_TRACKER.md`](./docs/FEATURE_TRACKER.md)
- [`docs/DEVELOPMENT_ROADMAP.md`](./docs/DEVELOPMENT_ROADMAP.md)
- [`docs/AI_PROMPT_TEMPLATES.md`](./docs/AI_PROMPT_TEMPLATES.md)
