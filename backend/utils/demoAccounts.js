import { ROLES } from "./constants";

/**
 * Demo academy and accounts created by `npm run seed`, and shown to judges
 * when EVALUATION_MODE is on (docs/API_CONTRACTS.md §2.27).
 */
export const DEMO_ACADEMY_NAME = "Demo Academy";

export const DEMO_ACCOUNTS = [
  { name: "Coach Demo", email: "coach@academy.test", role: ROLES.COACH, isHeadCoach: true },
  { name: "Scout Demo", email: "scout@academy.test", role: ROLES.SCOUT },
  {
    name: "Player Demo",
    email: "player@academy.test",
    role: ROLES.PLAYER,
    player: { name: "Player Demo", age: 16, sport: "Cricket" },
  },
];
