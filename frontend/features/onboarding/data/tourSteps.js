import { APP_NAME } from "@/frontend/utils/config";

// Guided tour, one group of steps per page. A step's `target` is a list of CSS selectors; the first
// visible match is highlighted. No target (or none visible, e.g. the sidebar on mobile) = centered card.

const nav = (href) => [`aside nav a[href="${href}"]`];

export const TOUR_GROUPS = [
  {
    id: "landing",
    match: (path) => path === "/",
    steps: [
      {
        title: `Welcome to ${APP_NAME}`,
        body: `${APP_NAME} helps sports academies track practice attendance, record matches and show scouts which players are match-ready. Here's a quick look around.`,
      },
      {
        target: ["#roles"],
        title: "Three roles, one app",
        body: "Coaches run the academy, players follow their own progress, and scouts only see players who are Ready.",
      },
      {
        target: ["#readiness"],
        title: "The Ready rule",
        body: `A player is Ready with at least 75% practice attendance and 2 matches played. ${APP_NAME} works this out automatically.`,
      },
      {
        target: ['main a[href="/register"]', 'a[href="/register"]'],
        title: "Start here",
        body: "Head Coach? Create your academy. Joining as a coach or scout? You'll need a join code from your Head Coach. Players get their login from their coach.",
      },
    ],
  },
  {
    id: "register",
    match: (path) => path === "/register",
    steps: [
      {
        target: ['form [role="group"]'],
        title: "Create or join",
        body: "Choose Create an academy if you're the Head Coach. Choose Join an academy if someone sent you a join code.",
      },
      {
        target: ['form input[name="academyName"]', 'form input[name="joinCode"]'],
        title: "Your academy",
        body: "Type your academy's name, or paste the join code you received. A join code decides whether you join as a coach or a scout.",
      },
      {
        target: ['form button[type="submit"]'],
        title: "Finish sign-up",
        body: "Add your name, email and a password, then submit. You'll go straight to your dashboard.",
      },
    ],
  },
  {
    id: "login",
    match: (path) => path === "/login",
    steps: [
      {
        target: ['form input[type="email"]'],
        title: "Sign in",
        body: "Use your account's email and password. Players: use the temporary password from your coach. You'll choose your own right after.",
      },
    ],
  },
  {
    id: "password",
    match: (path) => path === "/account/password",
    steps: [
      {
        target: ["main form"],
        title: "Choose your own password",
        body: "Pick a password only you know. Once it's saved, the rest of the app unlocks.",
      },
    ],
  },
  {
    id: "coach-home",
    match: (path) => path === "/coach",
    steps: [
      {
        title: "Your coach dashboard",
        body: `${APP_NAME} follows a simple order: invite your team, add players, run sessions, record matches, then track readiness. Let's walk through it.`,
      },
      {
        target: nav("/coach/academy"),
        title: "1 · Invite your team",
        body: "Open Academy to copy the join codes for your coaches and scouts, and send them over.",
      },
      {
        target: nav("/coach/players"),
        title: "2 · Add players",
        body: "Create each player's profile and login. You'll get login details to share with them.",
      },
      {
        target: nav("/coach/sessions"),
        title: "3 · Run practice sessions",
        body: "Mark every player Present or Absent, then close the session to lock attendance.",
      },
      {
        target: nav("/coach/matches"),
        title: "4 · Record matches",
        body: "Pick players who were present at that day's closed session and enter their scores.",
      },
      {
        target: nav("/coach/readiness"),
        title: "5 · Track readiness",
        body: "See who's Ready (75% attendance and 2 matches) and what everyone else still needs.",
      },
    ],
  },
  {
    id: "coach-academy",
    match: (path) => path === "/coach/academy",
    steps: [
      {
        target: ["main code"],
        title: "Your join codes",
        body: "Copy a code and send it to the coach or scout you want to invite. They enter it on the sign-up page under Join an academy.",
      },
    ],
  },
  {
    id: "coach-players",
    match: (path) => path === "/coach/players",
    steps: [
      {
        target: ['main a[href="/coach/players/new"]'],
        title: "Add a player",
        body: "Every player needs a profile before they can join sessions and matches. Start here.",
      },
    ],
  },
  {
    id: "coach-players-new",
    match: (path) => path === "/coach/players/new",
    steps: [
      {
        target: ["main form"],
        title: "Profile and login together",
        body: "Fill in the player's details and login email. After saving you'll see the login details to share with them.",
      },
    ],
  },
  {
    id: "coach-sessions",
    match: (path) => path === "/coach/sessions",
    steps: [
      {
        target: ['main a[href="/coach/sessions/new"]'],
        title: "Start a practice session",
        body: "Create a session for a date and sport. Every active player of that sport is added to its roster.",
      },
    ],
  },
  {
    id: "coach-sessions-new",
    match: (path) => path === "/coach/sessions/new",
    steps: [
      {
        target: ["main form"],
        title: "Session details",
        body: "Pick the date and sport, then create the session. You'll mark attendance on the next screen.",
      },
    ],
  },
  {
    id: "coach-session-detail",
    match: (path) => /^\/coach\/sessions\/(?!new$)[^/]+$/.test(path),
    steps: [
      {
        target: ['[role="radiogroup"]'],
        title: "Mark attendance",
        body: "Choose Present or Absent for each player. Attendance counts towards the 75% Ready rule.",
      },
      {
        target: ['[data-tour="close-session"]'],
        title: "Close the session",
        body: "Closing locks attendance. Only players present at a closed session can be picked for that day's match.",
      },
    ],
  },
  {
    id: "coach-matches",
    match: (path) => path === "/coach/matches",
    steps: [
      {
        target: ['main a[href="/coach/matches/new"]'],
        title: "Record a match",
        body: "Close the day's practice session first, then record the match with the players who were present.",
      },
      {
        target: ['[data-tour="match-list"]'],
        title: "Your fixtures",
        body: "Every match shows its date, opponent and top scorer. Open one for the full scoreboard.",
      },
    ],
  },
  {
    id: "coach-matches-new",
    match: (path) => path === "/coach/matches/new",
    steps: [
      {
        target: ["main form"],
        title: "Players and scores",
        body: "Choose the date and sport first. Only players present at that day's closed session can be selected, then enter each score.",
      },
    ],
  },
  {
    id: "coach-match-detail",
    match: (path) => /^\/coach\/matches\/(?!new$)[^/]+$/.test(path),
    steps: [
      {
        target: ['[aria-label="Match summary"]'],
        title: "Scoreboard",
        body: "Match totals, the top three performers and every player's score. Use Edit to fix a score.",
      },
    ],
  },
  {
    id: "coach-readiness",
    match: (path) => path === "/coach/readiness",
    steps: [
      {
        target: ['main [role="group"]'],
        title: "Who's Ready?",
        body: "Filter by Ready or Not ready. Each player shows their attendance and matches, so you can see what they still need.",
      },
    ],
  },
  {
    id: "player-home",
    match: (path) => path === "/player",
    steps: [
      {
        title: "Your dashboard",
        body: "Here you'll see your attendance, your matches and whether you're Ready for scouts. You need 75% attendance and 2 matches.",
      },
    ],
  },
  {
    id: "scout-home",
    match: (path) => path === "/scout",
    steps: [
      {
        target: ['main input[aria-label="Search players"]'],
        title: "Find talent",
        body: "Only Ready players appear here. Search or filter by sport, then open a player to see their record.",
      },
    ],
  },
];

export function tourGroupFor(pathname) {
  return TOUR_GROUPS.find((group) => group.match(pathname)) ?? null;
}
