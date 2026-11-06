# How to Test AthleteIQ

A simple, step-by-step guide to check that everything works. No coding knowledge needed.

You'll play every role yourself: first you **create an academy** (as its Head Coach), then you're a **Player**, then a **Scout**, and finally a **second academy** to prove each academy's data stays private. Follow the steps **in order**, because each step uses what you created in the step before.

⏱️ **Time needed:** about 60 minutes.

Each step ends with **✅ Pass if**. If what you see matches, tick the box. If not, write it down in the [Problems found](#problems-found) table at the end.

---

## Before you start

### 1. Choose where you're testing

| | **Local site** (your computer) | **Live site** (on the internet) |
| --- | --- | --- |
| Address | http://localhost:3000 | The Vercel link, e.g. `https://your-app.vercel.app` |
| How to open it | In the project folder, run `npm run dev` in a terminal. Wait until it says **Ready**, then open the address | Just open the link |
| Join codes | Nothing to set up: you create your own academy, and its join codes appear on the **Academy** page | Same as local |

Everything below works the same on both. Wherever this guide says **"the site"**, use your address from this table.

> **Testing the live site?** Use a test database, or names like "Test Arjun", so you don't mix test data with real data.

### Shortcut for judges (evaluation mode)

If the site runs with **evaluation mode** on, you'll see a yellow **"For evaluation only"** box:
- On **Sign in**, with ready-made Coach, Scout and Player logins. Click **Use** to fill the form.
- On **Create account → Join an academy**, with the demo academy's join codes. Click **Use** to fill the code.

You can use these to look around quickly. For the full test, still follow the parts below, which create your own academy.

### Guided tour

The first time you open AthleteIQ, it asks whether you'd like a short **guided tour** of each page. Either choice is fine for testing. If you take the tour, follow its hints or close it at any time.

### 2. Open two browser windows

You'll be logged in as two people at once, so you need two windows:

- **Window 1 (Coach):** your normal browser window.
- **Window 2 (Player / Scout):** a **private / incognito** window (Chrome: `Ctrl + Shift + N`).

> If you use only one window, logging in as a player logs the coach out.

### 3. Keep a notepad open

You'll write down a few passwords as you go.

---

## Part 1 – Is the site up?

**Window 1:** open the site.

- [ ] **1.1** The home page loads with the heading **"Run your sports academy from one place."**
  ✅ Pass if the page looks complete: header, a sample player card marked "Example", and sections for Roles and Readiness.

- [ ] **1.2** Scroll to the bottom, to **System status**.
  ✅ Pass if it says **Database: Operational** with a green dot.

- [ ] **1.3** Click **Recheck**.
  ✅ Pass if it briefly says "Checking" and then "Operational" again.

---

## Part 2 – Create your academy

Anyone can create a new academy. Whoever creates it becomes its **Head Coach**. Other coaches and scouts join later with a **join code** the Head Coach gives them.

**Window 1:** click **Sign in**, then **Create or join an academy** (under the form).

- [ ] **2.1** Check the two tabs at the top: **Create an academy** and **Join an academy**.
  ✅ Pass if there's no way to sign up as a player. The page says players get their login from their coach.

- [ ] **2.2** Choose **Create an academy**. Fill in: Academy name `Test Cricket Academy`, your name `Coach Kim`, email `kim@test.com`, password `CoachKim123`, and a **different** password in "Confirm password". Click **Create academy**.
  ✅ Pass if you see **"Passwords do not match"**.

- [ ] **2.3** Type `CoachKim123` in both password boxes and click **Create academy**.
  ✅ Pass if you land on the **Coach overview** ("Welcome back, Coach"). The sidebar shows the academy name **Test Cricket Academy** at the top, and **"Head Coach"** under your name at the bottom.

- [ ] **2.4** Sidebar → **Academy**.
  ✅ Pass if you see two codes that look like `K7P2-9QX4-M3T8`: a **Coach join code** and a **Scout join code**, each with a **Copy** button. **Write both codes in your notepad.** You'll use them later.

- [ ] **2.5** Log out (the icon next to your name at the bottom of the sidebar). Go to sign-up, choose **Join an academy**, and type `AAAA-BBBB-CCCC` as the join code.
  ✅ Pass if it says **"This join code doesn't match any academy"**.

- [ ] **2.6** Type the **Coach join code** from your notepad.
  ✅ Pass if a green box says **"You're joining Test Cricket Academy as a Coach"**. Don't finish signing up. Go back to **Sign in**.

- [ ] **2.7** Log in as `kim@test.com`, first with a **wrong password**.
  ✅ Pass if you see **"Invalid email or password"**, and then the right password (`CoachKim123`) works.

---

## Part 3 – Add players

Only a coach can add players. When the coach adds a player, the player's login is created at the same time, with a **temporary password**.

**Window 1:** sidebar → **Players** → **Add player**.

- [ ] **3.1** Click **Create player** without filling anything in.
  ✅ Pass if every box shows a red "… is required" message.

- [ ] **3.2** Type age `3`.
  ✅ Pass if it says the age must be between **5 and 60**.

- [ ] **3.3** Add these five players. For each one, click **Generate** for the password, and **write the password in your notepad before clicking Create player**.

  | Name | Age | Sport (type exactly as shown) | Email |
  | --- | --- | --- | --- |
  | Arjun Mehta | 16 | `cricket` | arjun@test.com |
  | Bela Singh | 17 | `CRICKET` | bela@test.com |
  | Chen Li | 15 | `Cricket` | chen@test.com |
  | Fiona Football | 16 | `football` | fiona@test.com |
  | Dev Patel | 18 | `Cricket` | dev@test.com |

  ✅ Pass if after each one you see a green box: **"… is ready to sign in"**, showing the email and password, with a **Copy details** button.

- [ ] **3.4** Try adding another player with the email `arjun@test.com` again.
  ✅ Pass if you see **"This email is already registered"**.

- [ ] **3.5** Go to **Players**.
  ✅ Pass if all 5 players are listed. Arjun, Bela and Chen all show the sport as exactly **"Cricket"**, even though you typed it differently. Each player shows **Active** and **Temporary password**.

- [ ] **3.6** Type `bela` in the search box, then pick **Football** in the sport filter.
  ✅ Pass if the search shows only Bela, and the filter shows only Fiona.

---

## Part 4 – A player logs in for the first time

New players must replace the temporary password the coach gave them.

**Window 2 (private):** open the site → **Sign in**.

- [ ] **4.1** Log in as `bela@test.com` with **Bela's temporary password** from your notepad.
  ✅ Pass if you're taken straight to a **"Change password"** page with the note "Choose your own password".

- [ ] **4.2** Try to skip it: change the address to `/player`.
  ✅ Pass if you're sent back to the Change password page.

- [ ] **4.3** Fill in the temporary password, then the new password `BelaOwn123` twice. Click **Change password**.
  ✅ Pass if you land on Bela's dashboard ("Welcome back, Bela").

- [ ] **4.4** Log out, then log in with the **old temporary password**.
  ✅ Pass if it says **"Invalid email or password"**, and `BelaOwn123` works.

- [ ] **4.5** Do the same first-login change for **Arjun** (new password `ArjunOwn123`), then **log out**.

- [ ] **4.6** **Window 1:** refresh **Players**.
  ✅ Pass if Arjun and Bela no longer show "Temporary password".

---

## Part 5 – Manage players (edit, deactivate, reset password)

**Window 1:** Players → click **Dev Patel**.

- [ ] **5.1** Click **Edit**, change age to `19`, then **Save changes**.
  ✅ Pass if you see "Changes saved." and the age shows 19.

- [ ] **5.2** Click **Edit** again, switch **Active** off, then Save.
  ✅ Pass if Dev now shows **Inactive**.

- [ ] **5.3** **Window 2:** log in as `dev@test.com` with Dev's temporary password.
  ✅ Pass if it says **"This account has been disabled"**. (Leave Dev inactive. It's used later.)

- [ ] **5.4** **Window 2:** log in as **Bela** (`BelaOwn123`) and stay logged in.

- [ ] **5.5** **Window 1:** open **Bela Singh** → **Reset** → **Generate** → **Set password**. Write down the new temporary password.
  ✅ Pass if a green box shows Bela's new login details.

- [ ] **5.6** **Window 2:** refresh the page.
  ✅ Pass if Bela has been **logged out** (her session ended, because the coach reset her password).

- [ ] **5.7** Log in as Bela with the **new temporary password**, then change it back to `BelaOwn123`. Log out.

---

## Part 6 – Practice session and attendance

A coach creates a practice session, marks each player **Present** or **Absent**, then **closes** the session. Once closed, it can never be changed.

**Window 1:** sidebar → **Sessions** → **New session**.

- [ ] **6.1** The date is already **today**. Type sport `cricket`.
  ✅ Pass if the hint below says **"3 active players play Cricket"**. (Dev is inactive and Fiona plays football, so they don't count.)

- [ ] **6.2** Click **Create session**.
  ✅ Pass if the list shows exactly **Arjun, Bela and Chen**, each with **Present / Absent** buttons, and the cards read Eligible 3, Unmarked 3.

- [ ] **6.3** Click **Present** for Arjun.
  ✅ Pass if the row is highlighted with "Unsaved", and the bottom says "1 unsaved change".

- [ ] **6.4** Mark **Arjun Present** and **Bela Present**, then click **Save attendance**.
  ✅ Pass if you see "Attendance saved" and the cards read Present 2, Unmarked 1.

- [ ] **6.5** Look at the **Close session** box.
  ✅ Pass if the button is greyed out with **"Mark the remaining 1 player first."** You can't close until everyone is marked.

- [ ] **6.6** Mark **Chen Absent** → **Save attendance**. Then refresh the page.
  ✅ Pass if after the refresh, Arjun and Bela still show Present and Chen shows Absent.

- [ ] **6.7** Click **Close session**, then **Cancel**.
  ✅ Pass if a warning appears saying **"This can't be undone"**, and Cancel changes nothing.

- [ ] **6.8** Click **Close session** → **Yes, close session**.
  ✅ Pass if it shows **"Closed"**, the Present/Absent buttons disappear, and each player just shows a Present or Absent label. Refresh: it stays closed.

---

## Part 7 – Record a match

Only players who were **Present** at a **closed** practice session **on the same day** can play in that day's match.

**Window 1:** sidebar → **Matches** → **New match**.

- [ ] **7.1** Date: **today**. Sport: `cricket`.
  ✅ Pass if the player list shows **only Arjun and Bela**. **Chen is not offered**, because he was absent.

- [ ] **7.2** Change the sport to `Hockey`.
  ✅ Pass if it says there's **no Hockey session** that day, and offers to create one.

- [ ] **7.3** In a new tab, create a **Football** session for today, mark **Fiona Present**, **Save**, and **don't close it**. Back in the match form, choose sport `Football`.
  ✅ Pass if it says **"Close the session first"**. Players from an open session can't be picked yet.

- [ ] **7.4** Back to sport `Cricket`. Opponent `City XI`. Tick **Arjun** with score `55` and **Bela** with `32`. Click **Create match**.
  ✅ Pass if the match page shows **"vs City XI"**, Players 2, Total 87, Top score 55 (Arjun), Average 43.5. The scoreboard lists Arjun first.

- [ ] **7.5** Click **Edit**, change Arjun's score to `60`, then **Save changes**.
  ✅ Pass if you see "Match updated" and the total is now **92**.

- [ ] **7.6** In **Edit**, untick both players and click **Save changes**.
  ✅ Pass if it says **"A match needs at least one player."** Click **Cancel**.

- [ ] **7.7** Go to **Matches**.
  ✅ Pass if the match is listed with top scorer Arjun (60).

---

## Part 8 – Readiness (who is "Ready")

A player is **Ready** when they have **at least 75% attendance** and have played **at least 2 matches**. Only closed sessions count.

First, add a bit more history. **Window 1:** create and **close** three more **Cricket** sessions with **past dates** (change the date in the date picker), marked like this:

| Session date | Arjun | Bela | Chen |
| --- | --- | --- | --- |
| Yesterday | Present | Present | Present |
| 2 days ago | Present | Absent | Absent |
| 3 days ago | Absent | Absent | Present |

Then create a **Cricket match dated yesterday**, opponent `Town XI`, with **Arjun, Bela and Chen** (any scores).

Now everyone has 4 closed sessions:

| Player | Attended | Matches | Should be |
| --- | --- | --- | --- |
| Arjun | 3 of 4 = **75%** | 2 | **Ready** |
| Bela | 2 of 4 = 50% | 2 | Not ready (attendance too low) |
| Chen | 2 of 4 = 50% | 1 | Not ready |

- [ ] **8.1** Sidebar → **Readiness**.
  ✅ Pass if **Arjun shows Ready** at 75%, with his green bar reaching the 75% marker.

- [ ] **8.2** Look at Bela's and Chen's rows.
  ✅ Pass if Bela shows **Not ready** with "Attendance 50% (needs 75%)", and Chen shows "Attendance 50% (needs 75%) · 1 more match needed".

- [ ] **8.3** Click the **Ready** tab, then the **Not ready** tab.
  ✅ Pass if Ready shows only Arjun, and Not ready shows the others.

- [ ] **8.4** Click **Arjun**.
  ✅ Pass if his player page shows a **Performance & readiness** section with his attendance history (4 sessions) and match history (2 matches).

- [ ] **8.5** Create a Cricket session for a **future date**, mark Arjun **Absent**, save, and **don't close it**. Go back to **Readiness**.
  ✅ Pass if Arjun is **still 75% and Ready**. Open sessions don't count.

- [ ] **8.6** Go to **Overview**.
  ✅ Pass if "Ready players" shows **1**.

---

## Part 9 – What a player sees

Players can only ever see **their own** records.

**Window 2:** log in as **Arjun** (`ArjunOwn123`).

- [ ] **9.1** ✅ Pass if Arjun's dashboard shows the **Ready** badge, attendance 75%, 2 matches, his scores, and only his own history.

- [ ] **9.2** Log out and log in as **Bela** (`BelaOwn123`).
  ✅ Pass if Bela sees **her own** numbers: 50%, **"Not ready yet"**, and the reason. Nothing about Arjun or Chen appears.

- [ ] **9.3** As Bela, try typing these addresses: `/coach`, `/coach/players`, `/scout`.
  ✅ Pass if each one sends her back to her own dashboard.

- [ ] **9.4** Look at the sidebar.
  ✅ Pass if it only shows **My dashboard** and **Password**.

- [ ] **9.5** Log out.

---

## Part 10 – What a scout sees

Scouts join an academy with its **scout join code**, and can only see that academy's players who are **Ready**.

**Window 2:** sign-up page (**Sign in** → **Create or join an academy**) → **Join an academy**.

- [ ] **10.1** Type the **Scout join code** from your notepad.
  ✅ Pass if the green box says **"You're joining Test Cricket Academy as a Scout"**.

- [ ] **10.2** Finish signing up: `Scout Sam`, `sam@test.com`, password `ScoutSam123` (twice) → **Join academy**.
  ✅ Pass if you land on **Ready players**, and the list shows **only Arjun**.

- [ ] **10.3** Click **Arjun**.
  ✅ Pass if you see his readiness, stats and match history, and **no email address or login details anywhere**.

- [ ] **10.4** Try opening `/coach/players`.
  ✅ Pass if you're sent back to Ready players.

- [ ] **10.5** **Window 1 (coach):** set Arjun to **Inactive** (Players → Arjun → Edit → Active off → Save). **Window 2:** refresh.
  ✅ Pass if Arjun **disappears** from the scout's list ("No Ready players yet").

- [ ] **10.6** **Window 1:** set Arjun back to **Active**. **Window 2:** refresh.
  ✅ Pass if Arjun is back.

- [ ] **10.7** **Window 1:** sidebar → **Academy**.
  ✅ Pass if **Scout Sam** is listed under "Coaches & scouts".

---

## Part 11 – Final checks

- [ ] **11.1** **Logging out works:** in either window, click the log-out icon, then try to open `/coach`.
  ✅ Pass if you're sent to the Sign in page.

- [ ] **11.2** **Changing your own password:** log in as the coach → sidebar **Password** → change it.
  ✅ Pass if it works and the old password no longer does.

- [ ] **11.3** **Phone size:** make the browser window narrow (or open the site on your phone).
  ✅ Pass if the sidebar turns into a **☰ menu** button at the top. Pages remain readable, and tables can be scrolled sideways.

- [ ] **11.4** **Wrong links:** open `/coach/players/123`.
  ✅ Pass if it says "Player not found" instead of crashing.

---

## Part 12 – Academies stay separate

Each academy's players, sessions, matches and readiness are private.

**Window 2:** log out. Then sign up → **Create an academy**: `Other Academy`, `Olga Owner`, `olga@test.com`, password `OlgaOwner123`.

- [ ] **12.1** Look at **Players**, **Sessions**, **Matches** and **Readiness**.
  ✅ Pass if all are **empty**. Olga can't see anything from Test Cricket Academy.

- [ ] **12.2** **Window 1:** open Arjun's player page and copy the address from the address bar. **Window 2:** paste it.
  ✅ Pass if Olga sees **"Player not found"**, even with the exact address.

- [ ] **12.3** **Window 2:** create a **Cricket** session for today.
  ✅ Pass if the attendance list says there are **no active Cricket players** (Arjun, Bela and Chen belong to the other academy).

- [ ] **12.4** **Window 2:** sidebar → **Academy**.
  ✅ Pass if Olga has her **own, different** join codes, and only she is listed.

- [ ] **12.5** **Window 1:** Academy → **Scout join code** → **Generate a new code** → confirm. Then in Window 2, log out, go to sign-up → **Join an academy**, and type the **old** scout code from your notepad.
  ✅ Pass if it says **"This join code doesn't match any academy"**. Old codes stop working as soon as a new one is made.

- [ ] **12.6** *(Optional)* Join Test Cricket Academy as a **second coach** using the coach join code (e.g. `coach2@test.com`).
  ✅ Pass if the second coach sees the same players as Coach Kim. On their **Academy** page it says join codes are managed by the Head Coach, with no codes shown.

---

## The 11 official competition tests

All are covered by the steps above:

| # | Competition test | Where you tested it | ✔ |
| --- | --- | --- | --- |
| 1 | Create three players | Part 3 | ☐ |
| 2 | Create one practice session | 6.1–6.2 | ☐ |
| 3 | Mark two players Present and one Absent | 6.4–6.6 | ☐ |
| 4 | The absent player is recorded correctly | 6.6, 6.8 | ☐ |
| 5 | Create a same-day match | 7.4 | ☐ |
| 6 | The two present players can take part | 7.1, 7.4 | ☐ |
| 7 | The absent player is rejected | 7.1 | ☐ |
| 8 | Attendance below 75% is not Ready | 8.2 | ☐ |
| 9 | Exactly 75% with 2 matches is Ready | 8.1 | ☐ |
| 10 | The scout sees only Ready players | 10.2–10.5 | ☐ |
| 11 | A player sees only their own records | 9.1–9.3 | ☐ |

---

## Live site: extra checks

Do these once the app is deployed on Vercel.

- [ ] **L.1** The live link opens over **https://** (a padlock in the address bar).
- [ ] **L.2** System status on the home page shows **Operational**.
- [ ] **L.3** Parts 2–12 work exactly as they did locally.
- [ ] **L.3b** If the live database already had data from before academies existed, the person who deployed ran `npm run migrate:academy` once (against the live database). Old accounts can sign in and see their data.
- [ ] **L.4** Open the live site on a **phone** and log in as a player. The dashboard is readable.
- [ ] **L.5** Refresh any page while logged in. You stay logged in.
- [ ] **L.6** Leave the site for 10 minutes, come back and click around. It still works (the first load may be a little slower).

---

## Good to know (these are not bugs)

- A practice session **can't be edited or deleted** after it's created. If you make a mistake, just leave it open: it doesn't count until it's closed.
- A closed session can **never** be changed. That's on purpose.
- A match's **date and sport** can't be changed after it's created, but the opponent, players and scores can.
- Players **can't sign up** by themselves. Their coach creates their account.
- Anyone can create a new academy. That's on purpose: a new academy starts empty and can't see any other academy.
- One email address belongs to one academy. To be in two academies, use two emails.
- Only the **Head Coach** (the person who created the academy) can see and change the join codes.

---

## Problems found

If any step fails, add a row:

| Step | What I did | What I expected | What actually happened |
| --- | --- | --- | --- |
| | | | |

Take a screenshot of the problem if you can, and send it with the step number.

**Tested by:** ____________ **Date:** ____________ **Site:** Local / Live **Problems found:** ____

---

<details>
<summary><b>Optional: extra checks for technical testers</b></summary>

These prove the **server** itself blocks bad actions, even if someone bypasses the screens. Visit each address in the browser while logged in as the role shown. The page shows text, so look for the word in **bold**.

| Logged in as | Open this address | You should see |
| --- | --- | --- |
| Nobody (logged out) | `/api/players` | **UNAUTHENTICATED** |
| Player (Bela) | `/api/players` | **FORBIDDEN** |
| Player (Bela) | `/api/scout/players` | **FORBIDDEN** |
| Scout | `/api/coach/dashboard` | **FORBIDDEN** |
| Scout | `/api/scout/players/` + Bela's id (from her coach page address) | **NOT_FOUND** (she isn't Ready) |
| Olga (Other Academy) | `/api/players/` + Arjun's id | **NOT_FOUND** (other academy) |
| Anyone | `/api/health` | `"status":"connected"` |

You can also run the automated test suite in the project folder: `npm test` should report **all tests passed**.

</details>
