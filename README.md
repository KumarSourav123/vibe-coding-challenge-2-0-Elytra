# AthleteIQ

**AthleteIQ** is a web app for sports academies. Coaches track **practice attendance** and **match scores**, players follow their own progress, and scouts see only the players who are **ready**.

🌐 **Live site:** _add your Vercel link here_

---

## Who uses it

| Role | What they do |
| --- | --- |
| **Head Coach** | Creates the academy and invites coaches and scouts with join codes |
| **Coach** | Adds players, runs practice sessions, marks attendance, records matches and scores |
| **Player** | Sees only their own attendance, matches and readiness |
| **Scout** | Sees only the players who are **Ready** |

Every academy's data is private. One academy can never see another academy's players.

---

## How it works

1. **Create an academy.** Sign up → *Create an academy*. You become its Head Coach.
2. **Invite people.** Share the **join codes** from the *Academy* page. Coaches and scouts sign up with *Join an academy*.
3. **Add players.** The coach adds each player with an email and a temporary password. The player picks their own password at first sign-in.
4. **Practice sessions.** Create a session, mark each player **Present** or **Absent**, then **close** it. A closed session can't be changed.
5. **Matches.** Only players who were **Present** at that day's closed session can be picked. Enter a score for each.
6. **Readiness.** AthleteIQ works out who is Ready on its own.

### When is a player "Ready"?

> **Attendance of 75% or more** (in closed sessions) **and at least 2 matches played.**

---

## Features

- Four roles, each with its own pages and permissions
- Many academies on one site, each kept separate
- Add, edit, deactivate and reset players
- Practice sessions with attendance that locks when closed
- Matches with per-player scores, open to present players only
- Live readiness for coaches, a personal dashboard for players, and a Ready list for scouts
- A **guided tour** that explains each page the first time you visit (you can switch it off)
- Works on phones and computers

---

## Kept simple or visible for evaluation

These are on purpose, to make judging easy:

- **Yellow "For evaluation only" box.** It shows demo logins on *Sign in* and the demo academy's join codes on *Join an academy*, with **Use** buttons. It's switched on with `EVALUATION_MODE=true` and will be turned off after judging, when the codes become secret again.
- **Demo accounts.** `coach@academy.test`, `scout@academy.test` and `player@academy.test` are made by `npm run seed` and all share one password.
- **No emails are sent.** The coach passes login details to players directly.
- **No "forgot password" email.** The coach resets a player's password instead.
- **Anyone can create an academy.** It starts empty, so it can't affect anyone else.
- **Practice sessions can't be edited or deleted** once created. An unused open session simply doesn't count.

---

## Run it on your computer

1. Install: `npm install`
2. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `AUTH_SECRET` and `SEED_PASSWORD` (the file explains each one).
3. Create the demo academy and accounts: `npm run seed`
4. Start: `npm run dev`, then open http://localhost:3000

Check everything at once (code style, all tests and a production build) with `npm run check`.

---

## How it's built (in one minute)

AthleteIQ is **one Next.js app**. The pages and the API live together and deploy to Vercel as a single project.

```text
app/        Pages (what you see) and API routes (/api/...)
frontend/   Screens and reusable UI pieces, grouped by feature
backend/    Rules and data: models, services, validation, security checks
lib/        Shared basics: database connection, login tokens, role paths
tests/      280+ automated tests, run against a real (temporary) database
docs/       All documentation
```

- **Stack:** Next.js, React, MongoDB with Mongoose, and Tailwind CSS. Logins are built in-house with Node's built-in crypto, with no auth library.
- **Safety:** every API checks who you are and what academy you belong to *on the server*, never trusting the browser.

---

## More details

- [Documentation guide](docs/README.md): which document to read for what
- [How to test the app, step by step](docs/MANUAL_TEST_PLAN.md) (no coding needed)
- [How AthleteIQ is built](docs/ARCHITECTURE.md)
- [Deployment & settings](docs/DEPLOYMENT.md)
