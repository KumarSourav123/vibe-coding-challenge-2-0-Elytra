# Manual Test Plan – Phases 1 to 6

A full end-to-end test of everything built so far. Work through the sections **in order**: later steps reuse the data created earlier. Tick each box as you go and note any failure in the [results log](#12-results-log) at the end.

**Time needed:** about 60–90 minutes.

---

## 0. Before you start

### 0.1 Use a separate test database

Don't test on the database you'll demo with. In `.env.local`, point `MONGODB_URI` at a **test** database by putting a name after `.net/`:

```
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/sports-academy-test?retryWrites=true&w=majority
```

To start fresh later, delete the `sports-academy-test` database in Atlas (Browse Collections → database → Drop).

### 0.2 Check `.env.local` has every key

| Key | Example value | Used for |
| --- | --- | --- |
| `MONGODB_URI` | (see above) | Database |
| `AUTH_SECRET` | 32+ random characters | Login cookies |
| `COACH_SIGNUP_CODE` | `coach-code-2026` | Coach sign-up (section 4) |
| `SCOUT_SIGNUP_CODE` | `scout-code-2026` | Scout sign-up (section 4) |
| `SEED_PASSWORD` | `Academy@2026` | Demo accounts |

### 0.3 Two browser windows

Cookies are shared within one browser, so logging in as a player in the same window logs the coach out. Use:

- **Window C (Coach):** your normal browser window.
- **Window P (Player / Scout):** an **Incognito / Private** window.

### 0.4 IDs you'll collect

Some API checks need record IDs. You'll find them in the page URL, for example `/coach/players/6ae8…` (the ID is the last part). Note them here as you go:

| Item | ID |
| --- | --- |
| Player – Chen Li | |
| Player – Fiona Football | |
| Cricket session (today) | |
| Cricket match | |

### 0.5 How to run an API check from the browser

Some tests call the API directly, to prove the **server** blocks things even if someone bypasses the UI.

1. In the right window, press **F12**, then open the **Console** tab.
2. Paste the snippet shown in the step and press Enter.
3. Read the JSON printed. The expected `code` or `message` is listed in the step.

> If Chrome warns about pasting, type `allow pasting` and press Enter first.

---

## 1. Automated checks

Run in the project folder:

| # | Command | Expected | ✔ |
| --- | --- | --- | --- |
| 1.1 | `npm install` | Finishes without errors | ☐ |
| 1.2 | `npm run lint` | No errors printed | ☐ |
| 1.3 | `npm test` | `Test Files 27 passed`, `Tests 260 passed` | ☐ |
| 1.4 | `npm run build` | `✓ Compiled successfully`, with a route list | ☐ |
| 1.5 | `npm run seed` | Creates (or skips) coach@, scout@ and player@academy.test | ☐ |
| 1.6 | `npm run seed` again | All three show `skip … (already exists)` | ☐ |
| 1.7 | `npm run dev` | `Ready` at http://localhost:3000 | ☐ |

Keep `npm run dev` running for the rest of the test.

---

## 2. Phase 1 – Landing page and health

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 2.1 | Open http://localhost:3000 | Hero "Run your sports academy from one place.", an example readiness card labelled **Example**, and Roles, Readiness and Status sections | ☐ |
| 2.2 | Scroll to **System status** | Database: **Operational** (green dot), with a latency in ms | ☐ |
| 2.3 | Click **Recheck** | Briefly shows Checking, then Operational again | ☐ |
| 2.4 | Open http://localhost:3000/api/health | JSON with `"success":true` and `"database":{"status":"connected",…}` | ☐ |
| 2.5 | Header links Roles / Readiness / Status | Each scrolls to its section | ☐ |
| 2.6 | *(Optional)* Change one character of the password in `MONGODB_URI`, restart `npm run dev`, reload | Status shows **Disconnected**, and `/api/health` returns `DB_CONNECTION_FAILED` with no connection string in the response. **Revert the change and restart afterwards** | ☐ |

---

## 3. Phase 2 – Login, roles and protected pages

Use the seed accounts with your `SEED_PASSWORD`.

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 3.1 | Window C: open `/coach` while signed out | Redirected to `/login?next=%2Fcoach` | ☐ |
| 3.2 | Log in as `coach@academy.test` with a **wrong password** | Red banner "Invalid email or password" | ☐ |
| 3.3 | Log in as `nobody@academy.test` (unknown email) | **Same** message as 3.2, with no hint that the email doesn't exist | ☐ |
| 3.4 | Submit with both fields empty | "Email is required" and "Password is required" under the fields | ☐ |
| 3.5 | Log in as `COACH@Academy.TEST` (mixed case) with the right password | Works. Lands on `/coach` with the sidebar showing Overview, Players, Sessions and Matches | ☐ |
| 3.6 | Refresh the page | Still signed in | ☐ |
| 3.7 | While signed in, open `/login` | Redirected to `/coach` | ☐ |
| 3.8 | Open `/player`, then `/scout` | Both redirect back to `/coach` | ☐ |
| 3.9 | Window P: log in as `scout@academy.test` | Lands on `/scout` with a scout sidebar (Ready players marked Soon) | ☐ |
| 3.10 | Window P: open `/coach/players` | Redirected to `/scout` | ☐ |
| 3.11 | Window P: open http://localhost:3000/api/players | `"code":"FORBIDDEN"` (scouts can't use coach APIs) | ☐ |
| 3.12 | Window P: log out (icon next to your name, bottom of sidebar) | Back on `/login` | ☐ |
| 3.13 | Window P: open http://localhost:3000/api/auth/me | `"code":"UNAUTHENTICATED"` | ☐ |
| 3.14 | Window P: log in as `player@academy.test` | Lands on `/player` | ☐ |
| 3.15 | Window P: open `/coach` | Redirected to `/player` | ☐ |
| 3.16 | Window P: log out | Signed out | ☐ |
| 3.17 | *(Mobile)* In Window C, shrink the window to phone width (or use DevTools device mode) | The sidebar becomes a top bar with a ☰ menu, which opens a slide-in menu | ☐ |

---

## 4. Phase 3a – Coach and scout sign-up (access codes)

Use Window P (signed out).

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 4.1 | `/login`, then click "Create one" | `/register` page | ☐ |
| 4.2 | Register: Name `Coach Two`, email `coach2@academy.test`, role Coach, access code `wrong-code`, password `coachtwo123` (both fields) | Error under Access code: "Invalid access code". No account is created | ☐ |
| 4.3 | Same, but with the **scout** code while role is Coach | "Invalid access code" (each role has its own code) | ☐ |
| 4.4 | Same, with password `short` | "Password must be at least 8 characters" | ☐ |
| 4.5 | Confirm password that doesn't match | "Passwords do not match" | ☐ |
| 4.6 | Correct `COACH_SIGNUP_CODE` and matching passwords | Account created. Signed in and on `/coach` | ☐ |
| 4.7 | Log out. Register again with the **same email** and the right code | "This email is already registered" | ☐ |
| 4.8 | Register `scout2@academy.test`, role Scout, with `SCOUT_SIGNUP_CODE` | Lands on `/scout` | ☐ |
| 4.9 | Check the role dropdown | Only Coach and Scout. No Player option | ☐ |
| 4.10 | Log out of Window P | | ☐ |

---

## 5. Phase 3b – Player management

Window C, signed in as the coach. Go to **Players**, then **Add player**.

### 5.1 Validation

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 5.1.1 | Click **Create player** with everything empty | Each field shows "… is required" | ☐ |
| 5.1.2 | Name `A`, Age `3`, Sport `Cricket`, Email `bad`, Temp password `short` | Messages: name ≥ 2 characters, age 5–60, email invalid, password ≥ 8 characters | ☐ |
| 5.1.3 | Use email `coach@academy.test` (already taken) with otherwise valid data | "This email is already registered". **The players list doesn't gain a new player** (no half-created records) | ☐ |

### 5.2 Create the test players (compulsory test 1)

Create these. Click **Generate** for the temporary password, then **write it down** before saving.

| Name | Age | Sport (type exactly) | Email | ✔ |
| --- | --- | --- | --- | --- |
| Arjun Mehta | 16 | `cricket` | arjun@academy.test | ☐ |
| Bela Singh | 17 | `CRICKET ` (capitals + space) | bela@academy.test | ☐ |
| Chen Li | 15 | `Cricket` | chen@academy.test | ☐ |
| Fiona Football | 16 | `football` | fiona@academy.test | ☐ |
| Dev Patel | 18 | `Cricket` | dev@academy.test | ☐ |

| # | Check | Expected | ✔ |
| --- | --- | --- | --- |
| 5.2.1 | After each save | A green card "… is ready to sign in" with the email and password, and **Copy details** works | ☐ |
| 5.2.2 | Players list | All 5 players appear. Arjun's, Bela's and Chen's sport all show exactly **Cricket** (normalized) | ☐ |
| 5.2.3 | Badges | Each shows **Active** and **Temporary password** | ☐ |
| 5.2.4 | Search `bela` | Only Bela | ☐ |
| 5.2.5 | Search `fiona@` | Only Fiona (searches email too) | ☐ |
| 5.2.6 | Sport filter **Football** | Only Fiona | ☐ |
| 5.2.7 | Search `zzz` | "No players match your filters", with **Clear filters** | ☐ |
| 5.2.8 | Overview page | "Active players" counts all players. The hint shows how many are awaiting sign-in | ☐ |

Note Chen's and Fiona's IDs from their page URLs in table 0.4.

### 5.3 First login with a temporary password

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 5.3.1 | Window P: log in as `arjun@academy.test` with his temporary password | Lands on **/account/password** with "Choose your own password" | ☐ |
| 5.3.2 | Window P: try opening `/player` | Sent back to `/account/password` | ☐ |
| 5.3.3 | Window P: open http://localhost:3000/api/players | `"code":"PASSWORD_CHANGE_REQUIRED"` | ☐ |
| 5.3.4 | Change password with a **wrong** temporary password | "Current password is incorrect" | ☐ |
| 5.3.5 | New password = the temporary password | "New password must be different…" | ☐ |
| 5.3.6 | Correct temp password, new `ArjunOwn123` (twice) | Lands on `/player` ("Welcome back, Arjun") | ☐ |
| 5.3.7 | Log out, log in with the **old** temporary password | "Invalid email or password" | ☐ |
| 5.3.8 | Log in with `ArjunOwn123` | Goes straight to `/player`, with no forced change | ☐ |
| 5.3.9 | Window C: refresh Arjun's page | Login card shows Password: **Set by player**. The list no longer shows "Temporary password" for Arjun | ☐ |

### 5.4 Edit, deactivate and reset

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 5.4.1 | Window C: open **Dev Patel**, then **Edit**, change age to 19, Save | "Changes saved." Age 19 shown | ☐ |
| 5.4.2 | Edit Dev, toggle **Active** off, Save | Badge **Inactive** | ☐ |
| 5.4.3 | Window P: log in as Dev with his temp password | "This account has been disabled" | ☐ |
| 5.4.4 | Window C: Players, status filter **Inactive** | Only Dev | ☐ |
| 5.4.5 | Keep Dev **inactive** (it's used in section 6) | | ☐ |
| 5.4.6 | Window P: log in as Arjun (`ArjunOwn123`) and stay on `/player` | Signed in | ☐ |
| 5.4.7 | Window C: open Arjun, **Reset**, **Generate**, **Set password**, then note the new password | Green card with new credentials. Login shows Password: **Temporary** | ☐ |
| 5.4.8 | Window P: refresh | Session has ended (sent to login, or "Your session has ended") | ☐ |
| 5.4.9 | Window P: log in as Arjun with the **new** temp password, then set the password back to `ArjunOwn123` | Works, then lands on `/player` | ☐ |
| 5.4.10 | Window P: log out | | ☐ |

---

## 6. Phase 4 – Practice sessions and attendance

Window C (coach). Go to **Sessions**.

### 6.1 Create a session (compulsory test 2)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 6.1.1 | **New session**: the date defaults to **today**. Type sport `cricket` | Hint: "3 active players play Cricket" (Dev is inactive, Fiona plays Football) | ☐ |
| 6.1.2 | Click **Create session** | Opens the session page, titled with today's date. Status **Open**. Stats: Eligible 3, Present 0, Absent 0, Unmarked 3 | ☐ |
| 6.1.3 | Roster | Exactly **Arjun, Bela, Chen**. No Fiona (other sport) and no Dev (inactive) | ☐ |

Note the session ID from the URL.

### 6.2 Mark attendance (compulsory tests 3–4)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 6.2.1 | Click **Present** for Arjun | The row highlights with "Unsaved". The bottom bar shows "1 unsaved change" | ☐ |
| 6.2.2 | Click **Undo changes** | The selection clears | ☐ |
| 6.2.3 | Arjun **Present**, Bela **Present**, then **Save attendance** | "Attendance saved." Present 2, Unmarked 1 | ☐ |
| 6.2.4 | Close session panel | Button disabled: "Mark the remaining 1 player first." | ☐ |
| 6.2.5 | Change Bela to **Absent** (don't save) | Close panel says "Save your attendance changes first." | ☐ |
| 6.2.6 | Set Bela back to **Present**, Chen **Absent**, then **Save** | Present 2, Absent 1, Unmarked 0 | ☐ |
| 6.2.7 | Refresh the page | Marks are kept: Arjun and Bela Present, Chen Absent | ☐ |

### 6.3 Close the session (closed sessions are immutable)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 6.3.1 | **Close session** | A warning appears: "This can't be undone" | ☐ |
| 6.3.2 | **Cancel** | Nothing changes | ☐ |
| 6.3.3 | **Close session**, then **Yes, close session** | "Session closed. Attendance is now locked." Status **Closed**. The roster is read-only with Present/Absent badges | ☐ |
| 6.3.4 | Refresh | Still closed. No Present/Absent buttons anywhere | ☐ |
| 6.3.5 | **API check:** in Window C's console, try to edit the closed session (snippet below) | `"code":"SESSION_CLOSED"` | ☐ |
| 6.3.6 | **API check:** try to close it again (snippet below) | `"code":"SESSION_CLOSED"` | ☐ |

```js
// 6.3.5 – replace the two IDs
await (await fetch("/api/sessions/SESSION_ID/attendance", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ records: [{ playerId: "CHEN_ID", status: "PRESENT" }] }),
})).json()

// 6.3.6
await (await fetch("/api/sessions/SESSION_ID/close", { method: "POST" })).json()
```

### 6.4 Eligibility checks via the API

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 6.4.1 | Create a second **Cricket** session for **tomorrow's** date, and note its ID | Open, Eligible 3 | ☐ |
| 6.4.2 | Console: mark **Fiona** in that session (snippet) | `NOT_ELIGIBLE`, "Fiona Football plays Football, not Cricket" | ☐ |
| 6.4.3 | Console: the same request listing Chen **twice** | Validation error "Each player can appear only once per request" | ☐ |
| 6.4.4 | Leave this session **open**. Don't mark anyone | | ☐ |

```js
// 6.4.2 – replace IDs (SESSION2_ID = tomorrow's session)
await (await fetch("/api/sessions/SESSION2_ID/attendance", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ records: [{ playerId: "FIONA_ID", status: "PRESENT" }] }),
})).json()
```

### 6.5 Other session cases

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 6.5.1 | New session today, sport `Archery` | Page says "No active Archery players". Eligible 0 | ☐ |
| 6.5.2 | Close it | Closes (no players to mark) | ☐ |
| 6.5.3 | New session **today**, sport `Football`. Mark Fiona **Present**, then **Save**. **Leave it open** | Present 1, status Open | ☐ |
| 6.5.4 | Sessions list | Today's Cricket and Archery sessions show **Closed**. Today's Football and tomorrow's Cricket sessions show **Open** with "x of y marked" and a progress bar | ☐ |
| 6.5.5 | Tabs **Open** / **Closed** and the sport filter | Filter correctly | ☐ |
| 6.5.6 | Overview | Open sessions 2, Closed sessions 2 | ☐ |

---

## 7. Phase 5 – Matches and scoring

Window C (coach). Go to **Matches**, then **New match**.

### 7.1 Eligibility in the picker

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7.1.1 | Date **today**, sport `cricket` | "Players & scores" lists **only Arjun and Bela**, marked "present". **Chen isn't offered** (absent) | ☐ |
| 7.1.2 | Change sport to `Football` | Selection clears. Warning **"Close the session first"**, because today's Football session is still open | ☐ |
| 7.1.3 | Change sport to `Hockey` | "No Hockey session on …" with a **New session** button | ☐ |
| 7.1.4 | Sport `Cricket`, date **tomorrow** | "Close the session first" (tomorrow's session is open) | ☐ |

### 7.2 Create the match (compulsory tests 5–6)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7.2.1 | Date today, sport Cricket, opponent empty, select Arjun, then **Create match** | "Opponent is required". Arjun's row says "Enter a score" | ☐ |
| 7.2.2 | Opponent `City XI`. Arjun score `55`, Bela `32`. Click **Create match** | Opens the match page "vs City XI". Players 2, Total 87, Top score 55 (Arjun), Average 43.5. Scoreboard: 1 Arjun 55, 2 Bela 32 | ☐ |
| 7.2.3 | Try a score of `-5` on a new match | "Score must be 0–100000" | ☐ |

Note the match ID from the URL.

### 7.3 Absent player is rejected (compulsory test 7)

The UI doesn't offer Chen, so prove the **server** rejects him too:

```js
// Window C console – replace CHEN_ID; use today's date in YYYY-MM-DD form
await (await fetch("/api/matches", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ date: "YYYY-MM-DD", sport: "Cricket", opponent: "Test XI",
    participants: [{ playerId: "CHEN_ID", score: 10 }] }),
})).json()
```

| # | Expected | ✔ |
| --- | --- | --- |
| 7.3.1 | `NOT_ELIGIBLE` with "Chen Li was absent on YYYY-MM-DD", and **no** match created (the Matches list is unchanged) | ☐ |
| 7.3.2 | Same snippet with **FIONA_ID** and sport `Football`: "…was not marked present in a closed Football session…" (her session is open) | ☐ |
| 7.3.3 | Same snippet with the **Cricket** sport and a match **date of tomorrow**, using Arjun's ID: rejected (tomorrow's session isn't closed) | ☐ |

### 7.4 Edit a match

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7.4.1 | Match page, **Edit**: opponent `City XI B`, Arjun 60 | Picker shows Arjun and Bela, already ticked with their scores | ☐ |
| 7.4.2 | **Save changes** | "Match updated." Total 92, top 60 | ☐ |
| 7.4.3 | Edit, untick both players, Save | "A match needs at least one player." | ☐ |
| 7.4.4 | Cancel | Unchanged | ☐ |

### 7.5 Matches list and overview

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7.5.1 | Matches list | "vs City XI B", today's date, Cricket, 2 players, top scorer Arjun 60 | ☐ |
| 7.5.2 | Sport filter **Football** | "No Football matches" | ☐ |
| 7.5.3 | Overview | Matches 1 | ☐ |
| 7.5.4 | Close today's **Football** session, then New match: today + Football | Fiona is now offered. You can create a Football match with her | ☐ |

---

## 7b. Phase 6 – Readiness dashboards

Ready = **attendance ≥ 75%** of closed sessions **and ≥ 2 matches played**. It's calculated live from the records you created above.

### 7b.1 Build the readiness scenario

You need several closed Cricket sessions on **different past dates**, so attendance percentages differ. In Window C, create and **close** these sessions (the date picker lets you choose past dates). Mark exactly as shown:

| Session date | Arjun | Bela | Chen |
| --- | --- | --- | --- |
| today (from section 6) | Present | Present | Absent |
| today − 1 day | Present | Present | Present |
| today − 2 days | Present | Absent | Absent |
| today − 3 days | Absent | Absent | Present |

Then create a second Cricket match on **today − 1 day** with Arjun, Bela and Chen (any scores).

Expected totals:

| Player | Attendance | Matches | Ready? |
| --- | --- | --- | --- |
| Arjun | 3 of 4 = **75%** | 2 | **Ready** (exactly 75%, compulsory test 9) |
| Bela | 2 of 4 = 50% | 2 | Not ready (attendance below 75%, compulsory test 8) |
| Chen | 2 of 4 = 50% | 1 | Not ready |

### 7b.2 Coach

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7b.2.1 | Sidebar → **Readiness** | Cards: Players, Ready, Not ready. Arjun shows **Ready** with 75% and a full green bar at the 75% marker | ☐ |
| 7b.2.2 | Bela's row | **Not ready**, with "Attendance 50% (needs 75%)" | ☐ |
| 7b.2.3 | Chen's row | "Attendance 50% (needs 75%) · 1 more match needed" | ☐ |
| 7b.2.4 | Tabs **Ready** / **Not ready**, the sport filter and search | Filter correctly | ☐ |
| 7b.2.5 | Click Arjun | Player page. The **Performance & readiness** section shows stats, the readiness card, match history and attendance history (4 closed sessions) | ☐ |
| 7b.2.6 | Open sessions don't count: create a Cricket session for **today + 5 days**, mark Arjun Absent, and **leave it open** | Arjun is still 75% and Ready | ☐ |
| 7b.2.7 | Overview | "Ready players" shows 1 | ☐ |

### 7b.3 Player (compulsory test 11)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7b.3.1 | Window P: log in as **Arjun** (`ArjunOwn123`) | Dashboard "Welcome back, Arjun", badge **Ready**, his attendance and matches only | ☐ |
| 7b.3.2 | Log in as **Bela** (change her temporary password first if asked) | Her own data: 50%, **Not ready yet**, with the reason | ☐ |
| 7b.3.3 | As Bela, open `/api/player/dashboard?playerId=ARJUN_ID` | Still **Bela's** data (the id is ignored) | ☐ |
| 7b.3.4 | As Bela, open `/api/players/ARJUN_ID/performance` and `/api/scout/players` | `FORBIDDEN` | ☐ |
| 7b.3.5 | As Bela, open `/scout` and `/coach/readiness` | Redirected to `/player` | ☐ |

### 7b.4 Scout (compulsory test 10)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 7b.4.1 | Window P: log in as `scout@academy.test` | **Ready players** list shows **only Arjun** | ☐ |
| 7b.4.2 | Click Arjun | Detail with readiness, stats and history. **No email or login info** anywhere | ☐ |
| 7b.4.3 | Open `/scout/players/BELA_ID` | "Player not available" (not Ready) | ☐ |
| 7b.4.4 | Open `/api/scout/players/BELA_ID` | `NOT_FOUND` | ☐ |
| 7b.4.5 | Window C: deactivate Arjun. Window P: refresh the scout list | Arjun disappears. "No Ready players yet". **Reactivate Arjun afterwards** | ☐ |

---

## 8. Security and access control (all phases)

| # | Step | Expected | ✔ |
| --- | --- | --- | --- |
| 8.1 | Window P signed in as **Arjun**: open `/coach/sessions` and `/coach/matches` | Redirected to `/player` | ☐ |
| 8.2 | Window P (Arjun): open `/api/sessions`, `/api/matches`, `/api/players` | Each returns `"code":"FORBIDDEN"` | ☐ |
| 8.3 | Window P as **scout@academy.test**: the same three API URLs | `FORBIDDEN` | ☐ |
| 8.4 | Window P **signed out**: the same three API URLs | `UNAUTHENTICATED` | ☐ |
| 8.5 | Window P signed out: `/coach/players/<any id>` | Redirected to login | ☐ |
| 8.6 | Atlas → `sports-academy-test` → `users` collection → any document | `passwordHash` starts with `scrypt$…`. **No plain password anywhere** | ☐ |
| 8.7 | DevTools → Application → Cookies → `sa_session` | **HttpOnly** is ticked | ☐ |
| 8.8 | Console: `document.cookie` | Does **not** contain `sa_session` | ☐ |
| 8.9 | Open `/coach/players/123` and `/coach/sessions/123` | "Player not found" / "Session not found" (no crash) | ☐ |

---

## 9. Data check in Atlas (optional)

| # | Collection | Check | ✔ |
| --- | --- | --- | --- |
| 9.1 | `players` | Arjun, Bela and Chen have `sport: "Cricket"`. Dev has `isActive: false` | ☐ |
| 9.2 | `sessions` | Today's Cricket session: `status: "CLOSED"`, `closedAt` set, 3 attendance entries, Chen `ABSENT` | ☐ |
| 9.3 | `matches` | One Cricket match with 2 participants (Arjun 60, Bela 32) | ☐ |
| 9.4 | `users` | Each player user has a `player` field pointing at its profile | ☐ |

---

## 10. Compulsory competition test coverage

| # | Competition test | Covered by | Status |
| --- | --- | --- | --- |
| 1 | Create three players | 5.2 | ☐ |
| 2 | Create one practice session | 6.1 | ☐ |
| 3 | Mark two Present, one Absent | 6.2 | ☐ |
| 4 | Absent player recorded correctly | 6.2.7, 9.2 | ☐ |
| 5 | Create a same-day match | 7.2 | ☐ |
| 6 | Two present players can participate | 7.2.2 | ☐ |
| 7 | Absent player rejected | 7.1.1, 7.3.1 | ☐ |
| 8 | Attendance below 75% is not Ready | 7b.2.2 | ☐ |
| 9 | Exactly 75% and 2 matches is Ready | 7b.2.1 | ☐ |
| 10 | Scout sees only Ready players | 7b.4.1–7b.4.4 | ☐ |
| 11 | Player sees only their own records | 7b.3.1–7b.3.4 | ☐ |

Extra required checks:

| Check | Covered by | Status |
| --- | --- | --- |
| Unauthenticated API access | 3.13, 8.4 | ☐ |
| Unauthorized role access | 3.11, 8.2, 8.3 | ☐ |
| Player accessing another player's data | 7b.3.3, 7b.3.4 | ☐ |
| Editing a closed session | 6.3.5 | ☐ |
| Duplicate attendance / participation | 6.4.3, and the automated tests | ☐ |
| Invalid request data | 5.1, 7.2.3, 6.4.2 | ☐ |

---

## 11. Known limitations (not bugs)

- Sessions can't be edited or deleted. A mistaken open session can be left unused, because it only counts once closed.
- There's no rate limiting on login attempts yet (planned for Phase 7 if time allows).

---

## 12. Results log

Copy a row for every failed step.

| Step # | What you did | What you expected | What happened | Screenshot / console output |
| --- | --- | --- | --- | --- |
| | | | | |

**Sign-off:** Tested by ________ on ________ · Total failures: ____
