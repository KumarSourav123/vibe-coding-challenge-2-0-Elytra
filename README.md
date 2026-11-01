# Apex Sports Academy Management System
## 7-Day Vibe Coding Challenge 2.0

> A modern, role-governed Sports Academy Management System built with **Next.js 14 App Router**, **JavaScript**, **Tailwind CSS**, and **MongoDB Atlas**.

---

## 🏆 Current Progress: Phase 1 Foundation Complete

Phase 1 establishes the architectural foundation, responsive design system, landing page, stakeholder role portals, and live database health check integration.

### Implemented in Phase 1:
- [x] **Next.js 14 App Router Setup**: Modern JavaScript application structure with Tailwind CSS.
- [x] **Application Layout & Theme**: Deep slate athletic aesthetic (`#0B1120`) with Emerald Green accents, responsive navigation, and sticky header.
- [x] **High-Impact Landing Page**: Hero banner highlighting the 75% attendance rule, 2-match threshold, and session immutability.
- [x] **Stakeholder Role Cards**: Dedicated feature profiles and modal previews for **Coach**, **Player**, and **Talent Scout**.
- [x] **Database & API Health Monitor**: Live connection monitor pinging `GET /api/health` with loading, connected, and disconnected states.
- [x] **Interactive Simulation Controls**: Built-in mock switcher to test connected and disconnected states independently before backend merge.
- [x] **12 Core Business Rules Showcase**: Complete visual reference for academy competition rules.
- [x] **Verified Production Build**: `npm run build` passes cleanly with zero errors.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v25.9.0)
- npm 10+

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your MongoDB Atlas connection string when ready to test live database operations:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sports_academy?retryWrites=true&w=majority
NEXT_PUBLIC_APP_NAME=Sports Academy
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 5. Running the Production Build
```bash
npm run build
npm run start
```

---

## 📁 Project Architecture & Boundaries

```text
vibe-coding-challenge-2-0-Elytra/
├── app/
│   ├── layout.js              # Application layout & metadata
│   ├── page.js                # Phase 1 Landing Page
│   └── globals.css            # Tailwind directives & athletic theme
│
├── frontend/                  # FRONTEND DEVELOPER OWNED
│   ├── components/common/     # Button, Card, Badge, Navbar, Footer, AppLayout
│   ├── features/
│   │   ├── health/            # HealthStatusCard, useHealthCheck, healthApi, healthMock
│   │   ├── roles/             # RoleCard, RoleShowcase, rolesData
│   │   └── landing/           # HeroBanner, AcademyRulesSection, TechStackSection
│   ├── hooks/                 # Reusable client hooks
│   └── utils/                 # api.js standardized fetch wrapper
│
├── backend/                   # BACKEND DEVELOPER OWNED
│   ├── models/                # User, Player, Session, Match models
│   └── services/              # Business logic & readiness algorithms
│
├── docs/                      # Project Documentation
│   ├── FRONTEND_DOCUMENTATION.md
│   └── (Shared documentation owned by Backend Developer)
│
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## 🔒 12 Core Business Rules

1. **Coach creates players** with name, age, and sport.
2. **Coach creates practice sessions** with date and sport.
3. **Coach marks attendance** (Present / Absent) for each eligible player.
4. **Coach closes practice sessions** once attendance is finalized.
5. **Closed sessions are immutable** and cannot be modified.
6. **Coach creates matches** with date, sport, and opponent.
7. **Same-Day Match Eligibility**: Only players present in that day's practice session can participate in the match.
8. **Player Match Scores**: Each participating player receives a recorded score.
9. **Attendance Percentage**: Calculated strictly from actual completed (closed) practice sessions.
10. **Readiness Formula**: A player is **Ready** only if:
    $$\text{Attendance} \ge 75\% \quad \text{AND} \quad \text{Matches Played} \ge 2$$
11. **Scout Visibility**: Scouts can view **only Ready players**.
12. **Player Data Isolation**: Players can view only their own records.

---

## 🗓️ 7-Day Roadmap Overview

- **Phase 1 (Today)**: Project Foundation & Database Health Monitor (Complete)
- **Phase 2**: Authentication & Role-Based Access Control (Coach, Player, Scout)
- **Phase 3**: Player Management & Roster CRUD
- **Phase 4**: Practice Sessions & Immutable Attendance
- **Phase 5**: Match Scheduling & Scoring (Same-Day Presence Validation)
- **Phase 6**: Automated Readiness Intelligence & Stakeholder Dashboards
- **Phase 7**: End-to-End Testing, Polish & Vercel Deployment

