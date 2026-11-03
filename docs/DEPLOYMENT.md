# Deployment & Settings

## Environment variables

Set these in `.env.local` (on your computer) and in **Vercel → Project → Settings → Environment Variables** (live site).

| Name | Needed | What it is |
| --- | --- | --- |
| `MONGODB_URI` | Always | MongoDB Atlas connection string. Put a database name after `.net/`, e.g. `/sports-academy`. **Secret** |
| `AUTH_SECRET` | Always | 32+ random characters used to sign logins. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. **Secret**. Changing it logs everyone out |
| `SEED_PASSWORD` | Dev / evaluation | Password for the demo accounts made by `npm run seed` |
| `EVALUATION_MODE` | Optional | `true` shows the demo logins and join codes to judges. Default `false` |
| `EVALUATION_ACADEMY_NAME` | Optional | Academy whose codes are shown (default `Demo Academy`) |
| `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_URL` | Optional | Display name and site address |

`MONGODB_URI` and `AUTH_SECRET` are never shown anywhere in the app, even in evaluation mode.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally at http://localhost:3000 |
| `npm run build` / `npm start` | Production build and run |
| `npm test` / `npm run lint` | Automated tests and code checks |
| `npm run seed` | Create the "Demo Academy" and the demo accounts (safe to re-run; skips existing ones) |
| `npm run migrate:academy` | One-time: move data created before academies existed into a "Sports Academy" (safe to re-run) |

`seed` and `migrate:academy` use the database in `.env.local`. To run them on the live database, temporarily point `MONGODB_URI` there, then switch it back.

## Getting the live site ready for judging

1. Run `npm run seed` against the live database.
2. In Vercel, set `EVALUATION_MODE=true` and `SEED_PASSWORD` (the same value you seeded with). Redeploy.
3. If the live database had data from before academies existed, run `npm run migrate:academy` once.

## After judging

1. Set `EVALUATION_MODE=false` in Vercel and redeploy. The yellow box disappears.
2. Sign in as the demo Head Coach → **Academy** → **Generate a new code** for both codes, so the shown codes stop working.
